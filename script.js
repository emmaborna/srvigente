// ===== Datos =====
let tareas = [];
let vista = "bandeja";
let indiceEditar = -1;

let titulos = {
    bandeja: "Bandeja de entrada",
    hoy: "Hoy",
    proximo: "Próximo",
    completadas: "Completadas",
    proyectos: "Proyectos",
    resumen: "Resumen",
    perfil: "Perfil"
};

// ===== Guardar y cargar =====
function cargarDatos() {
    let guardado = localStorage.getItem("tareas");

    if (guardado !== null) {
        try {
            tareas = JSON.parse(guardado);
        } catch (error) {
            tareas = [];
        }
    }
}

function guardarDatos() {
    localStorage.setItem("tareas", JSON.stringify(tareas));
}

// ===== Fechas =====
function formatoFecha(d) {
    let mes = String(d.getMonth() + 1).padStart(2, "0");
    let dia = String(d.getDate()).padStart(2, "0");

    return d.getFullYear() + "-" + mes + "-" + dia;
}

function fechaHoy() {
    return formatoFecha(new Date());
}

function fechaManana() {
    let d = new Date();
    d.setDate(d.getDate() + 1);
    return formatoFecha(d);
}

function formatoBonito(fecha) {
    if (!fecha) return "Sin fecha";

    let partes = fecha.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function textoFecha(fecha) {
    if (!fecha) return "Sin fecha";
    if (fecha === fechaHoy()) return "Hoy";
    if (fecha === fechaManana()) return "Mañana";
    if (fecha < fechaHoy()) return "Vencida · " + formatoBonito(fecha);

    return formatoBonito(fecha);
}

function ordenar() {
    tareas.sort(function(a, b) {
        let fa = a.fecha || "9999-99-99";
        let fb = b.fecha || "9999-99-99";

        return fa.localeCompare(fb);
    });
}

// ===== Funciones de ayuda =====
function ver(id, visible) {
    let el = document.getElementById(id);
    if (el) {
        el.style.display = visible ? "block" : "none";
    }
}

function limpiar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, function(c) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c];
    });
}

function contar(completada) {
    return tareas.filter(t => t.completada === completada).length;
}

function llenarSugerencias() {
    let opciones = "";

    for (let i = 0; i < tareas.length; i++) {
        opciones += '<option value="' + limpiar(tareas[i].texto) + '">';
    }

    let datalist = document.getElementById("datalistOptions");
    if (datalist) {
        datalist.innerHTML = opciones;
    }
}

function actualizar() {
    guardarDatos();
    llenarSugerencias();
    mostrarVista();
}

function mostrarVista() {
    if (vista === "resumen") {
        mostrarResumen();
    } else if (vista === "perfil") {
        mostrarPerfil();
    } else {
        mostrarTareas();
    }
}

// ===== Mostrar tareas =====
function debeMostrarse(tarea) {
    let hoy = fechaHoy();
    let inputBuscar = document.getElementById("exampleDataList");
    let buscado = inputBuscar ? inputBuscar.value.toLowerCase() : "";

    if (buscado !== "" &&
        !tarea.texto.toLowerCase().includes(buscado)) {
        return false;
    }

    if (vista === "completadas") {
        return tarea.completada;
    }

    if (tarea.completada) return false;

    if (vista === "hoy") {
        return tarea.fecha !== "" && tarea.fecha <= hoy;
    }

    if (vista === "proximo") {
        return tarea.fecha > hoy;
    }

    return true;
}

// ===== Crear fila de tarea =====
function crearFila(i) {
    let tarea = tareas[i];

    let estilo = tarea.completada
        ? "text-decoration-line-through text-muted"
        : "";

    let textoDeFecha = tarea.completada
        ? formatoBonito(tarea.fecha)
        : textoFecha(tarea.fecha);

    let claseFecha = "fecha";

    if (!tarea.completada && tarea.fecha !== "" &&
        tarea.fecha < fechaHoy()) {
        claseFecha += " fecha-vencida";
    }

    if (!tarea.completada && tarea.fecha === fechaHoy()) {
        claseFecha += " fecha-hoy";
    }

    let proyecto = "";

    if (tarea.proyecto && tarea.proyecto !== "Sin proyecto") {
        proyecto = '<span class="text-muted small">' +
            limpiar(tarea.proyecto) + '</span>';
    }

    return `
        <div class="d-flex align-items-center gap-2 border-bottom py-2 flex-wrap">

            <span class="flex-grow-1 ${estilo}">
                ${limpiar(tarea.texto)}
            </span>

            ${proyecto}

            <span class="${claseFecha}">
                ${textoDeFecha}
            </span>

            <button type="button"
                class="btn btn-sm btn-warning"
                onclick="editarTarea(${i})">
                Editar
            </button>

            <button type="button"
                class="btn btn-sm btn-success"
                onclick="completar(${i})">
                ${tarea.completada ? "Pendiente" : "Completado"}
            </button>

            <button type="button"
                class="btn btn-sm btn-danger"
                onclick="eliminar(${i})">
                Eliminar
            </button>

        </div>
    `;
}

// ===== Mostrar lista =====
function mostrarTareas() {
    let html = "";
    let total = 0;

    if (vista === "proyectos") {
        let nombres = [];

        for (let i = 0; i < tareas.length; i++) {
            if (!tareas[i].completada &&
                !nombres.includes(tareas[i].proyecto)) {
                nombres.push(tareas[i].proyecto);
            }
        }

        nombres.sort();

        for (let p = 0; p < nombres.length; p++) {
            let filas = "";

            for (let i = 0; i < tareas.length; i++) {
                if (tareas[i].proyecto === nombres[p] &&
                    debeMostrarse(tareas[i])) {
                    filas += crearFila(i);
                    total++;
                }
            }

            if (filas !== "") {
                html += '<div class="titulo-proyecto">' +
                    limpiar(nombres[p]) + '</div>' + filas;
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

    document.getElementById("palabra").textContent =
        total === 1 ? "tarea" : "tareas";

    document.getElementById("vacio-texto").textContent =
        vista === "completadas"
        ? "Aún no has completado ninguna tarea."
        : "Añade una tarea para empezar a organizar tu día.";

    ver("vacio", total === 0);
}

// ===== Completar tarea =====
function completar(i) {
    tareas[i].completada = !tareas[i].completada;
    actualizar();
}

// ===== Eliminar tarea =====
function eliminar(i) {
    if (confirm("¿Deseas eliminar esta tarea?")) {
        tareas.splice(i, 1);
        actualizar();
    }
}

// ===== Limpiar formulario =====
function limpiarFormulario() {
    indiceEditar = -1;

    document.getElementById("tarea-nombre").value = "";
    document.getElementById("tarea-fecha").value = fechaHoy();
    document.getElementById("tarea-proyecto").value = "";

    let tituloModal = document.querySelector("#modalTarea .modal-title");
    if (tituloModal) {
        tituloModal.textContent = "Nueva tarea";
    }

    let btnGuardar = document.querySelector("#modalTarea .modal-footer .btn-primary, #modalTarea .modal-footer button:last-child");
    if (btnGuardar) {
        btnGuardar.textContent = "Guardar tarea";
        btnGuardar.setAttribute("onclick", "guardarCambios()");
    }
}

// ===== Nueva tarea =====
function guardarTarea() {
    let nombre = document.getElementById("tarea-nombre").value.trim();
    let fecha = document.getElementById("tarea-fecha").value;
    let proyecto = document.getElementById("tarea-proyecto").value.trim();

    if (nombre === "") {
        alert("Escribe el nombre de la tarea");
        return;
    }

    if (proyecto === "") proyecto = "Sin proyecto";

    tareas.push({
        texto: nombre,
        fecha: fecha,
        proyecto: proyecto,
        completada: false
    });

    ordenar();

    let modalEl = document.getElementById("modalTarea");
    let modalInstancia = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstancia.hide();

    let inputDataList = document.getElementById("exampleDataList");
    let inputBuscarNav = document.getElementById("buscar-nav");
    if (inputDataList) inputDataList.value = "";
    if (inputBuscarNav) inputBuscarNav.value = "";

    limpiarFormulario();
    cambiarVista("bandeja");
    actualizar();
}

// ===== EDITAR TAREA =====
function editarTarea(i) {
    if (!tareas[i]) return;

    indiceEditar = i;
    let tarea = tareas[i];

    document.getElementById("tarea-nombre").value = tarea.texto;
    document.getElementById("tarea-fecha").value = tarea.fecha || "";
    document.getElementById("tarea-proyecto").value =
        tarea.proyecto === "Sin proyecto" ? "" : tarea.proyecto;

    let tituloModal = document.querySelector("#modalTarea .modal-title");
    if (tituloModal) {
        tituloModal.textContent = "Editar tarea";
    }

    let btnGuardar = document.querySelector("#modalTarea .modal-footer .btn-primary, #modalTarea .modal-footer button:last-child");
    if (btnGuardar) {
        btnGuardar.textContent = "Guardar cambios";
        btnGuardar.setAttribute("onclick", "guardarCambios()");
    }

    let modal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById("modalTarea")
    );
    modal.show();
}

// ===== GUARDAR CAMBIOS =====
function guardarCambios() {
    if (indiceEditar === -1 || !tareas[indiceEditar]) {
        guardarTarea();
        return;
    }

    let nombre = document.getElementById("tarea-nombre").value.trim();
    let fecha = document.getElementById("tarea-fecha").value;
    let proyecto = document.getElementById("tarea-proyecto").value.trim();

    if (nombre === "") {
        alert("Escribe el nombre de la tarea");
        return;
    }

    if (proyecto === "") proyecto = "Sin proyecto";

    tareas[indiceEditar].texto = nombre;
    tareas[indiceEditar].fecha = fecha;
    tareas[indiceEditar].proyecto = proyecto;

    ordenar();

    let modalEl = document.getElementById("modalTarea");
    let modalInstancia = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstancia.hide();

    limpiarFormulario();
    actualizar();
}

// ===== Buscar =====
function buscar(valor) {
    let inputDataList = document.getElementById("exampleDataList");
    let inputBuscarNav = document.getElementById("buscar-nav");

    if (inputDataList) inputDataList.value = valor;
    if (inputBuscarNav) inputBuscarNav.value = valor;

    if (vista === "resumen" || vista === "perfil") {
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

            if (tareas[i].fecha === hoy) paraHoy++;

            if (tareas[i].fecha !== "" && tareas[i].fecha < hoy) {
                vencidas++;
            }
        }
    }

    let total = pendientes + completadas;
    let porcentaje = total > 0
        ? Math.round(completadas * 100 / total)
        : 0;

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
    let nombre = localStorage.getItem("perfilNombre") || "";
    let correo = localStorage.getItem("perfilCorreo") || "";

    document.getElementById("perfil-nombre").value = nombre;
    document.getElementById("perfil-correo").value = correo;

    document.getElementById("avatar").textContent =
        nombre ? nombre.charAt(0).toUpperCase() : "?";

    document.getElementById("perfil-saludo").textContent =
        nombre ? "Hola, " + nombre : "Hola";

    document.getElementById("perfil-datos").textContent =
        "Tienes " + contar(false) + " tareas pendientes y " +
        contar(true) + " completadas.";
}

// ===== Cambiar vista =====
function cambiarVista(nueva) {
    vista = nueva;

    let h1 = document.querySelector("h1");
    if (h1) {
        h1.textContent = titulos[vista];
    }

    let botones = ["bandeja", "hoy", "proximo", "completadas", "perfil"];

    for (let i = 0; i < botones.length; i++) {
        let btn = document.getElementById("btn-" + botones[i]);
        if (btn) btn.classList.remove("active");
    }

    let activo = document.getElementById("btn-" + vista);

    if (activo !== null) {
        activo.classList.add("active");
    }

    let esLista = vista !== "resumen" && vista !== "perfil";

    ver("seccion-tareas", esLista);
    ver("conteo", esLista);
    ver("seccion-resumen", vista === "resumen");
    ver("seccion-perfil", vista === "perfil");

    mostrarVista();
}

// ===== Borrar completadas =====
function borrarCompletadas() {
    if (confirm("¿Borrar todas las tareas completadas?")) {
        tareas = tareas.filter(t => !t.completada);
        actualizar();
    }
}

// ===== Borrar todas =====
function borrarTodas() {
    if (confirm("¿Borrar todas las tareas?")) {
        tareas = [];
        actualizar();
    }
}

// ===== Guardar nombre =====
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
document.addEventListener("DOMContentLoaded", function () {
    let modalEl = document.getElementById("modalTarea");
    if (modalEl) {
        modalEl.addEventListener("hidden.bs.modal", function () {
            limpiarFormulario();
        });
    }

    cargarDatos();
    llenarSugerencias();
    cambiarVista("bandeja");
});
