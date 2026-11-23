// ===== Datos =====
let tareas = [];
let vista = "bandeja";

let titulos = {
    bandeja: "Bandeja de entrada",
    hoy: "Hoy",
    proximo: "Próximo",
    completadas: "Completadas",
    proyectos: "Proyectos",
    resumen: "Resumen",
    perfil: "Perfil"
};

// ===== Guardar y cargar (localStorage) =====
function cargarDatos() {
    let guardado = localStorage.getItem("tareas");

    if (guardado !== null) {
        tareas = JSON.parse(guardado);
    }
}

function guardarDatos() {
    localStorage.setItem("tareas", JSON.stringify(tareas));
}

// ===== Fechas =====
// Las fechas se guardan como "2026-11-23" (así las entrega el campo date)
function formatoFecha(d) {
    let mes = d.getMonth() + 1;
    let dia = d.getDate();

    if (mes < 10) {
        mes = "0" + mes;
    }
    if (dia < 10) {
        dia = "0" + dia;
    }

    return d.getFullYear() + "-" + mes + "-" + dia;
}

function fechaHoy() {
    let d = new Date();
    return formatoFecha(d);
}

function fechaManana() {
    let d = new Date();
    d.setDate(d.getDate() + 1);
    return formatoFecha(d);
}

// Convierte 2026-11-23 en 23/11/2026
function formatoBonito(fecha) {
    if (fecha == "") {
        return "Sin fecha";
    }

    let partes = fecha.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function textoFecha(fecha) {
    if (fecha == "") {
        return "Sin fecha";
    }
    if (fecha == fechaHoy()) {
        return "Hoy";
    }
    if (fecha == fechaManana()) {
        return "Mañana";
    }
    if (fecha < fechaHoy()) {
        return "Vencida · " + formatoBonito(fecha);
    }
    return formatoBonito(fecha);
}

// Ordena las tareas por fecha (las que no tienen fecha van al final)
function ordenar() {
    tareas.sort(function (a, b) {
        let fa = a.fecha;
        let fb = b.fecha;

        if (fa == "") {
            fa = "9999-99-99";
        }
        if (fb == "") {
            fb = "9999-99-99";
        }

        if (fa < fb) {
            return -1;
        }
        if (fa > fb) {
            return 1;
        }
        return 0;
    });
}

// ===== Funciones de ayuda =====
function ver(id, visible) {
    if (visible) {
        document.getElementById(id).style.display = "block";
    } else {
        document.getElementById(id).style.display = "none";
    }
}

// Evita que el texto escrito se convierta en etiquetas HTML
function limpiar(texto) {
    return texto.replace(/</g, "&lt;");
}

// Cuenta las tareas completadas (true) o pendientes (false)
function contar(completada) {
    let total = 0;

    for (let i = 0; i < tareas.length; i++) {
        if (tareas[i].completada == completada) {
            total++;
        }
    }

    return total;
}

function llenarSugerencias() {
    let opciones = "";

    for (let i = 0; i < tareas.length; i++) {
        opciones += '<option value="' + limpiar(tareas[i].texto) + '">';
    }

    document.getElementById("datalistOptions").innerHTML = opciones;
}

// Guarda, actualiza las sugerencias y vuelve a dibujar la vista actual
function actualizar() {
    guardarDatos();
    llenarSugerencias();
    mostrarVista();
}

function mostrarVista() {
    if (vista == "resumen") {
        mostrarResumen();
    } else if (vista == "perfil") {
        mostrarPerfil();
    } else {
        mostrarTareas();
    }
}

// ===== Lista de tareas =====
// Dice si una tarea se debe mostrar en la vista actual
function debeMostrarse(tarea) {
    let hoy = fechaHoy();
    let buscado = document.getElementById("exampleDataList").value.toLowerCase();

    if (buscado != "" && tarea.texto.toLowerCase().indexOf(buscado) == -1) {
        return false;
    }

    if (vista == "completadas") {
        return tarea.completada;
    }

    if (tarea.completada) {
        return false;
    }

    if (vista == "hoy") {
        // Hoy muestra lo de hoy y lo que ya venció
        return tarea.fecha != "" && tarea.fecha <= hoy;
    }

    if (vista == "proximo") {
        return tarea.fecha > hoy;
    }

    return true;
}

// Crea el HTML de una tarea (i es su posición en la lista)
function crearFila(i) {
    let tarea = tareas[i];
    let hoy = fechaHoy();

    let marcada = "";
    let estilo = "";
    if (tarea.completada) {
        marcada = "checked";
        estilo = " text-decoration-line-through text-muted";
    }

    let claseFecha = "fecha";
    let textoDeFecha = formatoBonito(tarea.fecha);
    if (!tarea.completada) {
        textoDeFecha = textoFecha(tarea.fecha);
        if (tarea.fecha != "" && tarea.fecha < hoy) {
            claseFecha = "fecha fecha-vencida";
        }
        if (tarea.fecha == hoy) {
            claseFecha = "fecha fecha-hoy";
        }
    }

    let proyecto = "";
    if (vista != "proyectos" && tarea.proyecto != "Sin proyecto") {
        proyecto = '<span class="text-muted small">' + limpiar(tarea.proyecto) + '</span>';
    }

    return '<div class="d-flex align-items-center gap-2 border-bottom py-2">' +
        '<input type="checkbox" class="form-check-input mt-0" ' + marcada + ' onclick="completar(' + i + ')">' +
        '<span class="flex-grow-1' + estilo + '">' + limpiar(tarea.texto) + '</span>' +
        proyecto +
        '<span class="' + claseFecha + '">' + textoDeFecha + '</span>' +
        '<button type="button" class="btn btn-sm btn-eliminar" onclick="eliminar(' + i + ')">✕</button>' +
        '</div>';
}

function mostrarTareas() {
    let html = "";
    let total = 0;

    if (vista == "proyectos") {
        // Primero buscamos los nombres de los proyectos
        let nombres = [];
        for (let i = 0; i < tareas.length; i++) {
            if (!tareas[i].completada && nombres.indexOf(tareas[i].proyecto) == -1) {
                nombres.push(tareas[i].proyecto);
            }
        }
        nombres.sort();

        // Después mostramos las tareas de cada proyecto
        for (let p = 0; p < nombres.length; p++) {
            let filas = "";
            for (let i = 0; i < tareas.length; i++) {
                if (tareas[i].proyecto == nombres[p] && debeMostrarse(tareas[i])) {
                    filas += crearFila(i);
                    total++;
                }
            }
            if (filas != "") {
                html += '<div class="titulo-proyecto">' + limpiar(nombres[p]) + '</div>' + filas;
            }
        }
    } else {
        for (let i = 0; i < tareas.length; i++) {
            if (debeMostrarse(tareas[i])) {
                html += crearFila(i);
                total++;
            }
        }
    }

    document.getElementById("lista-tareas").innerHTML = html;
    document.getElementById("contar").textContent = total;

    if (total == 1) {
        document.getElementById("palabra").textContent = "tarea";
    } else {
        document.getElementById("palabra").textContent = "tareas";
    }

    if (vista == "completadas") {
        document.getElementById("vacio-texto").textContent = "Aún no has completado ninguna tarea.";
    } else {
        document.getElementById("vacio-texto").textContent = "Añade una tarea para empezar a organizar tu día.";
    }

    ver("vacio", total == 0);
}

function completar(i) {
    if (tareas[i].completada) {
        tareas[i].completada = false;
    } else {
        tareas[i].completada = true;
    }
    actualizar();
}

function eliminar(i) {
    tareas.splice(i, 1);
    actualizar();
}

// ===== Nueva tarea =====
function limpiarFormulario() {
    document.getElementById("tarea-nombre").value = "";
    document.getElementById("tarea-fecha").value = fechaHoy();
    document.getElementById("tarea-proyecto").value = "";
}

function guardarTarea() {
    let nombre = document.getElementById("tarea-nombre").value.trim();
    let fecha = document.getElementById("tarea-fecha").value;
    let proyecto = document.getElementById("tarea-proyecto").value.trim();

    if (nombre !== "") {
        if (proyecto == "") {
            proyecto = "Sin proyecto";
        }

        let tarea = {
            texto: nombre,
            fecha: fecha,
            proyecto: proyecto,
            completada: false
        };

        tareas.push(tarea);
        ordenar();

        bootstrap.Modal.getInstance(document.getElementById("modalTarea")).hide();

        document.getElementById("exampleDataList").value = "";
        document.getElementById("buscar-nav").value = "";
        cambiarVista("bandeja");
        actualizar();
    } else {
        alert("Escribe el nombre de la tarea");
    }
}

// ===== Buscar =====
function buscar(valor) {
    document.getElementById("exampleDataList").value = valor;
    document.getElementById("buscar-nav").value = valor;

    if (vista == "resumen" || vista == "perfil") {
        cambiarVista("bandeja");
    } else {
        mostrarTareas();
    }
}

// ===== Resumen =====
function mostrarResumen() {
    let hoy = fechaHoy();
    let pendientes = 0;
    let paraHoy = 0;
    let vencidas = 0;
    let completadas = 0;

    for (let i = 0; i < tareas.length; i++) {
        if (tareas[i].completada) {
            completadas++;
        } else {
            pendientes++;

            if (tareas[i].fecha == hoy) {
                paraHoy++;
            }
            if (tareas[i].fecha != "" && tareas[i].fecha < hoy) {
                vencidas++;
            }
        }
    }

    let total = pendientes + completadas;
    let porcentaje = 0;
    if (total > 0) {
        porcentaje = Math.round(completadas * 100 / total);
    }

    document.getElementById("res-pendientes").textContent = pendientes;
    document.getElementById("res-hoy").textContent = paraHoy;
    document.getElementById("res-vencidas").textContent = vencidas;
    document.getElementById("res-completadas").textContent = completadas;
    document.getElementById("res-porcentaje").textContent = porcentaje;
    document.getElementById("res-barra").style.width = porcentaje + "%";
}

// ===== Perfil =====
function guardarPerfil() {
    let nombre = document.getElementById("perfil-nombre").value.trim();
    let correo = document.getElementById("perfil-correo").value.trim();

    if (nombre !== "") {
        localStorage.setItem("perfilNombre", nombre);
        localStorage.setItem("perfilCorreo", correo);
        alert("Perfil guardado correctamente");
        mostrarPerfil();
    } else {
        alert("Escribe tu nombre");
    }
}

function mostrarPerfil() {
    let nombre = localStorage.getItem("perfilNombre");
    let correo = localStorage.getItem("perfilCorreo");

    if (nombre === null) {
        nombre = "";
    }
    if (correo === null) {
        correo = "";
    }

    document.getElementById("perfil-nombre").value = nombre;
    document.getElementById("perfil-correo").value = correo;

    if (nombre !== "") {
        document.getElementById("avatar").textContent = nombre.charAt(0).toUpperCase();
        document.getElementById("perfil-saludo").textContent = "Hola, " + nombre;
    } else {
        document.getElementById("avatar").textContent = "?";
        document.getElementById("perfil-saludo").textContent = "Hola";
    }

    document.getElementById("perfil-datos").textContent =
        "Tienes " + contar(false) + " tareas pendientes y " + contar(true) + " completadas.";
}

// ===== Cambiar de vista =====
function cambiarVista(nueva) {
    vista = nueva;
    document.querySelector("h1").textContent = titulos[vista];

    // Marcar el botón activo de la barra lateral
    let botones = ["bandeja", "hoy", "proximo", "completadas", "perfil"];
    for (let i = 0; i < botones.length; i++) {
        document.getElementById("btn-" + botones[i]).classList.remove("active");
    }

    let activo = document.getElementById("btn-" + vista);
    if (activo !== null) {
        activo.classList.add("active");
    }

    // Mostrar solo la sección que corresponde
    let esLista = vista != "resumen" && vista != "perfil";
    ver("seccion-tareas", esLista);
    ver("conteo", esLista);
    ver("seccion-resumen", vista == "resumen");
    ver("seccion-perfil", vista == "perfil");

    mostrarVista();
}

// ===== Menú Opciones =====
function borrarCompletadas() {
    if (confirm("¿Borrar todas las tareas completadas?")) {
        let nuevas = [];

        for (let i = 0; i < tareas.length; i++) {
            if (!tareas[i].completada) {
                nuevas.push(tareas[i]);
            }
        }

        tareas = nuevas;
        actualizar();
    }
}

function borrarTodas() {
    if (confirm("¿Borrar todas las tareas?")) {
        tareas = [];
        actualizar();
    }
}

// ===== Ejemplo: guardar y mostrar un nombre =====
function guardar() {
    let nombre = document.getElementById("nombre").value;

    if (nombre !== "") {
        localStorage.setItem("miNombre", nombre);
        alert("Nombre guardado correctamente");
    } else {
        alert("Escribe algo");
    }
}

function mostrar() {
    let nombreGuardado = localStorage.getItem("miNombre");

    if (nombreGuardado !== null) {
        document.getElementById("resultado").textContent = nombreGuardado;
    } else {
        alert("No hay nada guardado");
    }
}

// ===== Al abrir la página =====
cargarDatos();
llenarSugerencias();
cambiarVista("bandeja");
