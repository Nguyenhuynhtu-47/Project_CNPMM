let io;

const setIo = (serverIo) => {
    io = serverIo;
};

const getIo = () => {
    if (!io) throw new Error("Socket not initialized");
    return io;
};

module.exports = { setIo, getIo };