var express = require("express");
var app = express();
var http = require('http');
var server = http.createServer(app);
var { Server } = require('socket.io');
var io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/cliente/index.html`);
});


let usuariosConectados = [];

io.on('connection', (socket) => {
    console.log('Usuario conectado');

    const actualizarUsuariosConectados = () => {
        io.emit('usuariosConectados', usuariosConectados.map(usuario => usuario.nombre));
    };

    socket.on('mensajeCliente', (mensaje) => {
        var remitente = socket.usuario || 'Anónimo';
        var mensajeCompleto = `${remitente.nombre}: ${mensaje}`;

        
        io.emit('mensajeServidor', mensajeCompleto);
    });

    socket.on('nombreUsuario', (nombre) => {
        socket.usuario = { nombre, id: socket.id };
        usuariosConectados.push(socket.usuario);
        actualizarUsuariosConectados();
        io.emit('mensajeServidor', `${nombre} se ha unido al chat.`);
    });

    socket.on('mensajePrivado', ({ destinatario, mensaje }) => {
        var remitente = socket.usuario;
        var destinatarioSocket = usuariosConectados.find(usuario => usuario.nombre === destinatario);

        if (destinatarioSocket) {
            io.to(destinatarioSocket.id).emit('mensajePrivado', {
                remitente: remitente.nombre,
                mensaje
            });

  
            io.to(socket.id).emit('mensajePrivado', {
                remitente: remitente.nombre,
                mensaje
            });
        } else {
            
            io.to(socket.id).emit('mensajeServidor', `El usuario ${destinatario} no está conectado.`);
        }
    });

    socket.on('disconnect', () => {
        var usuarioDesconectado = socket.usuario || 'Usuario';
        usuariosConectados = usuariosConectados.filter((usuario) => usuario.id !== socket.id);
        actualizarUsuariosConectados();
        io.emit('mensajeServidor', `${usuarioDesconectado.nombre} se ha desconectado.`);
    });
});

var PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor Socket.io corriendo en http://localhost:3000`);
});