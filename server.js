export default {
  onConnect(ws, room) {
    const connections = [...room.getConnections()];

    // Tell the new person how many peers are already here
    ws.send(JSON.stringify({
      type: "peers",
      count: connections.length
    }));

    // Tell everyone else that a new peer joined
    for (const peer of connections) {
      if (peer !== ws) {
        peer.send(JSON.stringify({ type: "peer-joined", from: ws.id }));
      }
    }
  },

  onMessage(message, ws, room) {
    const data = JSON.parse(message);

    // Relay WebRTC signalling + video sync to everyone else in the room
    if (["offer", "answer", "ice", "sync-video", "nick", "reaction", "queue-add", "queue-skip", "queue-sync", "rate-start", "rate-vote"].includes(data.type)) {
      for (const peer of room.getConnections()) {
        if (peer !== ws) {
          peer.send(JSON.stringify({ ...data, from: ws.id }));
        }
      }
    }

    // Relay recording sync signals to everyone else
    if (data.type === "sync-start" || data.type === "sync-stop") {
      for (const peer of room.getConnections()) {
        if (peer !== ws) {
          peer.send(JSON.stringify({ type: data.type }));
        }
      }
    }
  },

  onClose(ws, room) {
    // Tell everyone someone left
    for (const peer of room.getConnections()) {
      peer.send(JSON.stringify({ type: "peer-left", id: ws.id }));
    }
  }
};