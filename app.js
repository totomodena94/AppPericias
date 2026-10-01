/// ============================================
// DATOS ESTÁTICOS
// Vendedores agrupados por sede/división.
// ============================================
const vendedoresPorSede = {
  "salaria-nuovo": ["Barcilli", "Terzuoli", "Rossi", "Rossi Sciarra", "Montecchi", "Panetta", "Scrima", "Pileggi", "Gutu", "Felli", "Geamana", "Antinucci", "Fratesi", "Miele", "Mari", "Litta"],
  "salaria-usato": ["Grasso", "Corradini", "D'Angelo", "Pelini", "Serafini", "Gastaldello", "Risita", "Silvestri"],
  "appia-nuovo": ["Brutti", "Buttarelli", "Cesarini", "Chiarelli", "Alessandroni", "De Angelis", "Fresia", "Corirossi", "Perra", "Zevini", "Sacchi", "Scrocca", "Calderino", "Venditti"],
  "appia-usato": ["Amaricci", "Miscioscia", "Nobili"],
  "barberini": ["Limardi", "Macrí", "Nardulli", "Sbizzera", "Borgia"],
};

// Valor que se guarda en pericia.vendedor cuando se marca el checkbox
// "Non si conosce il venditore" (issue de vendedor desconocido, ej. datos
// que llegan de Wincar sin esa información). No es un vendedor real, así
// que se usa esta constante en vez de repetir el string a mano en cada
// lugar que lo necesita.
const VENDEDOR_DESCONOCIDO = "Sconosciuto";

// Genera un identificador único para cada pericia. Hace falta porque
// Elimina/Edita necesitan poder señalar SIEMPRE a la pericia correcta,
// sin importar en qué orden se esté mostrando la tabla (ver
// ordenarPorFechaDesc más abajo: antes de esto, Elimina/Edita usaban la
// posición en el array que se estaba mostrando, que deja de coincidir
// con la posición real en localStorage en cuanto se filtra, busca u
// ordena la tabla).
const generarId = function () {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

// Las pericias guardadas antes de agregar el campo "id" no lo tienen.
// Esta función corre una sola vez al arrancar la página y les asigna uno
// a las que les falte, para que Elimina/Edita también funcionen con
// datos viejos.
const migrarIdsSiHacenFalta = function () {
  const guardado = localStorage.getItem("pericias");
  if (guardado === null) return;

  const pericias = JSON.parse(guardado);
  let faltaAlguno = false;

  for (const pericia of pericias) {
    if (pericia.id === undefined) {
      pericia.id = generarId();
      faltaAlguno = true;
    }
  }

  if (faltaAlguno) {
    localStorage.setItem("pericias", JSON.stringify(pericias));
  }
};

// Ordena por fecha, de la más reciente a la más antigua (issue: una
// pericia de días atrás cargada hoy tiene que aparecer junto a las de
// ese día, no al final de la tabla por orden de carga). Devuelve un
// array nuevo: nunca tocamos el array original ni su orden en
// localStorage, solo el orden en que se pinta.
const ordenarPorFechaDesc = function (pericias) {
  return pericias.slice().sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
};


// ============================================
// FUNCIONES DE CÁLCULO (analítica)
// Reciben un array de pericias y devuelven un
// resultado calculado. No tocan el DOM.
// ============================================

// Devuelve solo las pericias de los últimos N meses (por defecto, para
// no mostrar los 3 años de historial completo apenas se abre la app).
const filtrarUltimosMeses = function (pericias, cantidadMeses) {
  const hoy = new Date();
  hoy.setMonth(hoy.getMonth() - cantidadMeses);

  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  const fechaLimite = `${año}-${mes}-${dia}`;

  return pericias.filter(function (pericia) {
    return pericia.fecha && pericia.fecha >= fechaLimite;
  });
};

// Cuenta cuántas pericias hay en total.
const calcularTotalMes = function (pericias) {
  return pericias.length;
};

// Agrupa las pericias por vendedor y cuenta cuántas
// tiene cada uno. Devuelve un array de pares
// [nombre, cantidad], ordenado de mayor a menor. No cuenta las pericias
// sin vendedor real (demo sin vendedor, o marcadas como "Sconosciuto"):
// no son datos de desempeño de ningún vendedor, así que no corresponde
// que aparezcan en el ranking.
const calcularPericiasPorVendedor = function (pericias) {
  const conteo = {};

  for (const pericia of pericias) {
    const nombreVendedor = pericia.vendedor;

    if (!nombreVendedor || nombreVendedor === VENDEDOR_DESCONOCIDO) continue;

    if (conteo[nombreVendedor] === undefined) {
      conteo[nombreVendedor] = 1; // primera vez que aparece este vendedor
    } else {
      conteo[nombreVendedor] += 1; // ya existía, se suma 1
    }
  }

  // Object.entries convierte { Rossi: 3, Grasso: 1 } en [["Rossi", 3], ["Grasso", 1]]
  const conteoComoArray = Object.entries(conteo);

  // ordena de mayor a menor cantidad (b[1] - a[1])
  const conteoComoArrayOrdenado = conteoComoArray.sort(function (a, b) {
    return b[1] - a[1];
  });

  return conteoComoArrayOrdenado;
};

// Busca, entre todas las pericias guardadas, la más reciente (por
// fecha) que tenga esta targa. Se usa para autocompletar el formulario
// cuando se carga una segunda pericia del mismo auto (issue #46).
// Devuelve undefined si no hay ninguna coincidencia.
const buscarUltimaPericiaPorTarga = function (targa, pericias) {
  const coincidencias = pericias.filter(function (pericia) {
    return pericia.targa === targa;
  });

  if (coincidencias.length === 0) {
    return undefined;
  }

  // ordena por fecha descendente (las fechas "YYYY-MM-DD" comparan bien
  // como strings) y toma la primera: la más reciente
  const ordenadasPorFechaDesc = coincidencias.slice().sort(function (a, b) {
    return (b.fecha || "").localeCompare(a.fecha || "");
  });

  return ordenadasPorFechaDesc[0];
};

// Calcula qué porcentaje de patentes distintas aparece
// más de una vez (o sea, se transformaron en una segunda pericia).
const calcularPorcentajeConversionPericias = function (pericias) {
  const conteo = {};

  for (const pericia of pericias) {
    const targaPericia = pericia.targa;

    if (conteo[targaPericia] === undefined) {
      conteo[targaPericia] = 1;
    } else {
      conteo[targaPericia] += 1;
    }
  }

  const conteoComoArray = Object.entries(conteo);

  // solo las patentes que aparecen más de una vez
  const patentesRepetidas = conteoComoArray.filter(function (entrada) {
    return entrada[1] > 1;
  });

  const porcentajeDeConversion = (patentesRepetidas.length / conteoComoArray.length) * 100;

  return porcentajeDeConversion;
};

// Agrupa TODO el historial por mes ("YYYY-MM") y cuenta cuántas pericias
// hay en cada uno. A diferencia de las demás funciones de esta sección,
// usa el historial completo a propósito (es para el gráfico de tendencia
// mensual, que tiene sentido solo mirando varios años). Devuelve las
// etiquetas ya ordenadas cronológicamente junto con sus conteos.
const agruparPorMes = function (pericias) {
  const conteo = {};

  for (const pericia of pericias) {
    if (!pericia.fecha) continue;
    const mes = pericia.fecha.slice(0, 7); // "YYYY-MM"

    if (conteo[mes] === undefined) {
      conteo[mes] = 1;
    } else {
      conteo[mes] += 1;
    }
  }

  // las claves "YYYY-MM" ordenan alfabéticamente igual que cronológicamente
  const mesesOrdenados = Object.keys(conteo).sort();
  const data = mesesOrdenados.map(function (mes) {
    return conteo[mes];
  });

  return { labels: mesesOrdenados, data: data };
};

// Devuelve solo las pericias del mes calendario en curso (distinto de
// filtrarUltimosMeses, que trae un rango de N meses hacia atrás).
const filtrarMesEnCurso = function (pericias) {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mesFormateado = String(hoy.getMonth() + 1).padStart(2, "0");
  const mesEnCurso = `${año}-${mesFormateado}`;

  return pericias.filter(function (pericia) {
    return pericia.fecha && pericia.fecha.startsWith(mesEnCurso);
  });
};

// Agrupa las pericias del mes en curso por día (1 al último día del mes)
// y, dentro de cada día, por tipo. Pensado para una barra apilada por día,
// con un segmento de color por tipo.
const agruparPorDiaYTipo = function (periciasDelMes) {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = hoy.getMonth(); // 0-11
  // día 0 del mes siguiente = último día de este mes
  const ultimoDia = new Date(año, mes + 1, 0).getDate();

  const porDia = {};
  for (let dia = 1; dia <= ultimoDia; dia++) {
    porDia[dia] = { perizia: 0, controperizia: 0, demo: 0 };
  }

  for (const pericia of periciasDelMes) {
    if (!pericia.fecha) continue;
    const dia = Number(pericia.fecha.slice(8, 10));
    if (!porDia[dia]) continue; // fecha corrupta o fuera de rango: se ignora
    if (porDia[dia][pericia.tipo] === undefined) continue; // tipo desconocido: se ignora
    porDia[dia][pericia.tipo] += 1;
  }

  const labels = [];
  const perizia = [];
  const controperizia = [];
  const demo = [];

  for (let dia = 1; dia <= ultimoDia; dia++) {
    labels.push(String(dia));
    perizia.push(porDia[dia].perizia);
    controperizia.push(porDia[dia].controperizia);
    demo.push(porDia[dia].demo);
  }

  return { labels: labels, perizia: perizia, controperizia: controperizia, demo: demo };
};

// Cuenta cuántas pericias del mes en curso hay de cada tipo.
const contarPorTipo = function (periciasDelMes) {
  const conteo = { perizia: 0, controperizia: 0, demo: 0 };

  for (const pericia of periciasDelMes) {
    if (conteo[pericia.tipo] === undefined) continue; // tipo desconocido: se ignora
    conteo[pericia.tipo] += 1;
  }

  return conteo;
};

// Cuenta, sobre el historial completo, cuántas patentes aparecen una sola
// vez ("únicas") contra cuántas aparecen más de una vez ("convertidas" a
// segunda pericia). Son los conteos crudos que necesita el gráfico 4;
// calcularPorcentajeConversionPericias ya calcula el porcentaje a partir
// de la misma idea, pero para un gráfico de torta se necesitan los conteos.
const contarConversion = function (pericias) {
  const conteo = {};

  for (const pericia of pericias) {
    const targaPericia = pericia.targa;
    if (conteo[targaPericia] === undefined) {
      conteo[targaPericia] = 1;
    } else {
      conteo[targaPericia] += 1;
    }
  }

  let unicas = 0;
  let convertidas = 0;

  for (const cantidad of Object.values(conteo)) {
    if (cantidad > 1) {
      convertidas += 1;
    } else {
      unicas += 1;
    }
  }

  return { unicas: unicas, convertidas: convertidas };
};


// ============================================
// FUNCIONES DE RENDERIZADO
// Leen datos de localStorage (o reciben un array
// ya filtrado) y actualizan el DOM.
// Se declaran ANTES de usarse, porque se llaman
// apenas carga la página.
// ============================================

// Escapa los caracteres especiales de HTML para que un texto
// escrito por el usuario (ej. notas) se muestre tal cual y no
// se interprete como HTML al ir dentro de innerHTML (evita XSS).
// Si el campo no existe (registro viejo importado), devuelve "".
const escaparHTML = function (texto) {
  if (texto === undefined || texto === null) {
    return "";
  }
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

// Pinta la tabla de pericias. Si no le pasan un array,
// lee todo desde localStorage; si le pasan uno
// (por ejemplo, ya filtrado), usa ese en su lugar.
const renderizarTabla = function (periciasARenderizar) {
  const filaTabla = document.querySelector("tbody");
  let pericias;

  if (periciasARenderizar === undefined) {
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }
  } else {
    pericias = periciasARenderizar;
  }

  // se ordena siempre acá, así cualquier llamada a renderizarTabla
  // (vista por defecto, filtros, búsqueda por targa) muestra las
  // pericias agrupadas por fecha sin tener que acordarse de ordenar
  // antes de llamarla
  pericias = ordenarPorFechaDesc(pericias);

  // guarda lo que está actualmente visible, para que
  // el botón de exportar CSV sepa qué exportar
  periciasVisibles = pericias;

  let contenidoTabla = "";

  for (const pericia of pericias) {
    contenidoTabla += `
      <tr>
        <td>${pericia.targa}</td>
        <td>${pericia.brand}</td>
        <td>${pericia.concesionaria}</td>
        <td>${pericia.vendedor}</td>
        <td>${pericia.fecha}</td>
        <td>${pericia.tipo}</td>
        <td>${escaparHTML(pericia.notas)}</td>
        <td>
          <button class="btn-eliminar" data-id="${pericia.id}">Elimina</button>
          <button class="btn-editar" data-id="${pericia.id}">Edita</button>
        </td>
      </tr>
      `;
  }

  filaTabla.innerHTML = contenidoTabla;
};

// Pinta el panel de análisis (total, top 3 vendedores,
// % de conversión a segunda pericia). Si no le pasan un
// array, lee todo desde localStorage; si le pasan uno
// (por ejemplo, ya filtrado a los últimos meses), usa ese.
const renderizarAnalisis = function (periciasParaAnalizar) {
  let pericias;

  if (periciasParaAnalizar === undefined) {
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }
  } else {
    pericias = periciasParaAnalizar;
  }

  const totalPericias = calcularTotalMes(pericias);
  const vendedoresOrdenados = calcularPericiasPorVendedor(pericias);
  const porcentaje = calcularPorcentajeConversionPericias(pericias);

  // slice() copia los primeros 3 elementos sin modificar el array original
  const top3 = vendedoresOrdenados.slice(0, 3);

  let listaVendedores = "";
  for (const entrada of top3) {
    listaVendedores += `<li>${entrada[0]}: ${entrada[1]} pericias</li>`;
  }

  const contenidoAnalisis = document.getElementById("contenido-analisis");

  contenidoAnalisis.innerHTML = `
    <p>Perizie totali: ${totalPericias}</p>
    <p>Top venditori:</p>
    <ul>${listaVendedores}</ul>
    <p>% conversione in seconda perizia: ${porcentaje.toFixed(1)}%</p>
  `;
};

// ============================================
// GRÁFICOS (Chart.js)
// Paleta validada con validate_palette.js (skill de dataviz):
// segura para daltonismo y con contraste chequeado, no elegida a ojo.
// ============================================
const coloresTipo = {
  perizia: "#2a78d6",
  controperizia: "#eb6834",
  demo: "#1baf7a",
};

const coloresConversion = {
  unicas: "#2a78d6",
  convertidas: "#eb6834",
};

// Guarda las instancias de Chart.js ya creadas, indexadas por id de
// canvas. Hace falta para poder destruir la instancia anterior antes de
// crear una nueva: si no, Chart.js las va acumulando en el mismo canvas
// y termina rompiendo el repintado.
const instanciasGraficos = {};

const crearOActualizarGrafico = function (idCanvas, config) {
  if (instanciasGraficos[idCanvas]) {
    instanciasGraficos[idCanvas].destroy();
  }
  const contexto = document.getElementById(idCanvas).getContext("2d");
  instanciasGraficos[idCanvas] = new Chart(contexto, config);
};

// Dibuja los 5 gráficos del panel de análisis. A diferencia de
// renderizarTabla/renderizarAnalisis, recibe siempre el historial
// COMPLETO: cada gráfico recorta lo que necesita puertas adentro
// (tendencia y conversión usan todo el historial; día/tipo y
// distribución por tipo usan solo el mes en curso; vendedores usa
// los últimos 3 meses), así que no tiene sentido pre-filtrar antes.
const renderizarGraficos = function (pericias) {
  // --- 1. Tendencia mensual (línea, historial completo) ---
  const tendencia = agruparPorMes(pericias);
  crearOActualizarGrafico("chart-tendencia-mensual", {
    type: "line",
    data: {
      labels: tendencia.labels,
      datasets: [{
        label: "Perizie al mese",
        data: tendencia.data,
        borderColor: coloresTipo.perizia,
        backgroundColor: coloresTipo.perizia,
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });

  // --- 2. Perizie per giorno, apiladas por tipo (mes en curso) ---
  const mesEnCurso = filtrarMesEnCurso(pericias);
  const porDia = agruparPorDiaYTipo(mesEnCurso);
  crearOActualizarGrafico("chart-dia-tipo", {
    type: "bar",
    data: {
      labels: porDia.labels,
      datasets: [
        { label: "Perizia", data: porDia.perizia, backgroundColor: coloresTipo.perizia },
        { label: "Controperizia", data: porDia.controperizia, backgroundColor: coloresTipo.controperizia },
        { label: "Demo", data: porDia.demo, backgroundColor: coloresTipo.demo },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });

  // --- 3. Distribución por tipo (donut, mes en curso) ---
  const porTipo = contarPorTipo(mesEnCurso);
  crearOActualizarGrafico("chart-distribucion-tipo", {
    type: "doughnut",
    data: {
      labels: ["Perizia", "Controperizia", "Demo"],
      datasets: [{
        data: [porTipo.perizia, porTipo.controperizia, porTipo.demo],
        backgroundColor: [coloresTipo.perizia, coloresTipo.controperizia, coloresTipo.demo],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    },
  });

  // --- 4. Conversión a segunda pericia (donut, historial completo) ---
  const conversion = contarConversion(pericias);
  crearOActualizarGrafico("chart-conversion", {
    type: "doughnut",
    data: {
      labels: ["Prima perizia", "Convertita in seconda perizia"],
      datasets: [{
        data: [conversion.unicas, conversion.convertidas],
        backgroundColor: [coloresConversion.unicas, coloresConversion.convertidas],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    },
  });

  // --- 5. Top 5 venditori (barras horizontales, últimos 3 meses) ---
  const ultimosTresMeses = filtrarUltimosMeses(pericias, 3);
  const topVendedores = calcularPericiasPorVendedor(ultimosTresMeses).slice(0, 5);
  crearOActualizarGrafico("chart-vendedores", {
    type: "bar",
    data: {
      labels: topVendedores.map(function (entrada) { return entrada[0]; }),
      datasets: [{
        label: "Perizie",
        data: topVendedores.map(function (entrada) { return entrada[1]; }),
        backgroundColor: coloresTipo.perizia,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
};

// Recalcula la vista por defecto (últimos 3 meses) y repinta tabla + análisis.
// La usamos en vez de llamar renderizarTabla()/renderizarAnalisis() sueltas,
// para no mostrar sin querer los 3 años de historial completo.
const mostrarVistaPorDefecto = function () {
  let pericias;
  const guardado = localStorage.getItem("pericias");
  if (guardado === null) {
    pericias = [];
  } else {
    pericias = JSON.parse(guardado);
  }

  const periciasRecientes = filtrarUltimosMeses(pericias, 3);

  renderizarTabla(periciasRecientes);
  renderizarAnalisis(periciasRecientes);
  renderizarGraficos(pericias); // usa el historial completo, no periciasRecientes
};


// ============================================
// REFERENCIAS AL DOM Y ESTADO GLOBAL
// Se declaran una sola vez, al arrancar.
// ============================================
const tbody = document.querySelector("tbody");
const formulario = document.querySelector("form");
const buscadorTarga = document.getElementById("buscador-targa");
const inputTarga = document.getElementById("targa");
const inputConcesionaria = document.getElementById("concesionaria");
const inputVendedor = document.getElementById("vendedor");
const inputVendedorDesconocido = document.getElementById("vendedor-desconocido");
const aplicaFiltro = document.getElementById("btn-aplicar-filtros");
const limpiarFiltro = document.getElementById("btn-limpiar-filtros");
const btnExportar = document.getElementById("btn-exportar-csv");
const btnCerrarMes = document.getElementById("btn-cerrar-mes");

let idEditando = null; // null = carga nueva; un id = editando esa pericia existente
let periciasVisibles = []; // lo que está actualmente pintado en la tabla (todo o filtrado)


// ============================================
// VENDEDOR SEGÚN SEDE
// El select de vendedores depende de qué sede se eligió
// (vendedoresPorSede), así que se repuebla dinámicamente.
// ============================================

// Repuebla el <select> de vendedores con los de la sede recibida.
// Se usa tanto al cambiar la sede a mano (evento "change") como al
// cargar una pericia existente para editar, donde hay que repoblar
// ANTES de poder asignarle el vendedor guardado (si no, el <select>
// todavía tiene las opciones de la sede anterior y el valor no pega).
const poblarVendedoresDeSede = function (sede) {
  const vendedoresDeLaSede = vendedoresPorSede[sede];

  inputVendedor.innerHTML = "";

  if (!sede || !vendedoresDeLaSede) {
    const opcionPlaceholder = document.createElement("option");
    opcionPlaceholder.value = "";
    opcionPlaceholder.textContent = "Prima seleziona una sede";
    inputVendedor.appendChild(opcionPlaceholder);
    return;
  }

  const opcionVacia = document.createElement("option");
  opcionVacia.value = "";
  opcionVacia.textContent = "Seleziona venditore";
  inputVendedor.appendChild(opcionVacia);

  for (const nombre of vendedoresDeLaSede) {
    const opcion = document.createElement("option");
    opcion.value = nombre;
    opcion.textContent = nombre;
    inputVendedor.appendChild(opcion);
  }
};

inputConcesionaria.addEventListener("change", (e) => {
  poblarVendedoresDeSede(e.target.value);
});

// Las pericias de tipo "demo" no tienen vendedor asociado (no se puede
// cargar una demo si se obliga a elegir uno). El resto de los tipos sí
// lo requieren. Como el campo requerido depende de un radio button
// distinto, alternamos el atributo "required" del select cada vez que
// cambia el tipo elegido, en vez de tocar la validación genérica del
// submit (que sigue siendo la misma para todos los campos).
// OJO: "disabled" por sí solo NO alcanza para saltarse la validación
// (comprobado: un <select required disabled> sigue dando
// validity.valid === false en Chrome). Por eso el required hay que
// desactivarlo a mano acá también, igual que con "demo".
const actualizarRequeridoVendedor = function () {
  const tipoSeleccionado = formulario.querySelector('input[name="tipo"]:checked');
  const esDemo = tipoSeleccionado !== null && tipoSeleccionado.value === "demo";
  inputVendedor.required = !esDemo && !inputVendedorDesconocido.checked;
};

formulario.addEventListener("change", (e) => {
  if (e.target.name === "tipo") {
    actualizarRequeridoVendedor();
  }
});

// A veces el dato del vendedor no se puede recuperar (ej. una pericia
// que llega de Wincar sin esa información, cargada días después, cuando
// ya se perdió el dato). El checkbox "Non si conosce il venditore"
// deshabilita el select (para que no se pueda tocar mientras está
// marcado) y recalcula el required — las dos cosas hacen falta, ver nota
// arriba.
inputVendedorDesconocido.addEventListener("change", (e) => {
  inputVendedor.disabled = e.target.checked;
  if (e.target.checked) {
    inputVendedor.value = ""; // no dejamos una selección vieja "colgada" mientras está deshabilitado
  }
  actualizarRequeridoVendedor();
});

// Vuelve el checkbox y el select de vendedor a su estado por defecto
// (desmarcado, habilitado). Se usa en los mismos momentos en que el
// formulario "arranca de cero" (ver precargarFechaHoy).
const restablecerVendedorDesconocido = function () {
  inputVendedorDesconocido.checked = false;
  inputVendedor.disabled = false;
};

// Población del filtro "Venditore" (panel de filtros): todos los
// vendedores de todas las sedes juntos, sin duplicados y ordenados
// alfabéticamente (acá no depende de ninguna sede, es un filtro global).
const filtroVendedorSelect = document.getElementById("filtro-venditore");
const todosLosVendedores = [...new Set(Object.values(vendedoresPorSede).flat())].sort();

for (const nombre of todosLosVendedores) {
  const opcion = document.createElement("option");
  opcion.value = nombre;
  opcion.textContent = nombre;
  filtroVendedorSelect.appendChild(opcion);
}


// ============================================
// CARRUSEL DE GRÁFICOS
// Los 5 gráficos del panel de análisis se muestran de a uno,
// deslizando con flechas o los puntos indicadores.
// ============================================
const carruselTrack = document.getElementById("graficos-track");
const carruselAnterior = document.getElementById("carousel-anterior");
const carruselSiguiente = document.getElementById("carousel-siguiente");
const carruselIndicadores = document.getElementById("carousel-indicadores");

let indiceGraficoActual = 0;
const cantidadGraficos = carruselTrack.children.length;

// Un punto indicador por gráfico, clickeable para saltar directo a ese.
for (let i = 0; i < cantidadGraficos; i++) {
  const punto = document.createElement("button");
  punto.type = "button";
  punto.setAttribute("aria-label", `Vai al grafico ${i + 1}`);
  punto.addEventListener("click", () => irAGrafico(i));
  carruselIndicadores.appendChild(punto);
}

// Desliza el carrusel al gráfico "indice", con vuelta circular
// (después del último vuelve al primero y viceversa), y marca
// el punto indicador correspondiente como activo.
const irAGrafico = function (indice) {
  if (indice < 0) {
    indice = cantidadGraficos - 1;
  } else if (indice >= cantidadGraficos) {
    indice = 0;
  }

  indiceGraficoActual = indice;
  carruselTrack.style.transform = `translateX(-${indice * 100}%)`;

  const puntos = carruselIndicadores.children;
  for (let i = 0; i < puntos.length; i++) {
    puntos[i].classList.toggle("activo", i === indice);
  }
};

carruselAnterior.addEventListener("click", () => irAGrafico(indiceGraficoActual - 1));
carruselSiguiente.addEventListener("click", () => irAGrafico(indiceGraficoActual + 1));

irAGrafico(0); // estado inicial


// ============================================
// FECHA POR DEFECTO
// El campo "Data" arranca con el día de hoy cargado
// (issue #46), pero sigue siendo editable a mano para
// cargar pericias atrasadas.
// ============================================

// Formatea un objeto Date como "YYYY-MM-DD": el formato que usa
// tanto el input type="date" como pericia.fecha en localStorage.
const formatearFechaISO = function (fecha) {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${año}-${mes}-${dia}`;
};

const precargarFechaHoy = function () {
  document.getElementById("fecha").value = formatearFechaISO(new Date());
  // aprovechamos que esta función corre en todo momento en que el
  // formulario "arranca de cero" (carga inicial, después de guardar,
  // después de "Pulisci") para limpiar también el aviso de autocompletado
  document.getElementById("targa-autocompletado").textContent = "";
};

precargarFechaHoy(); // estado inicial, apenas carga la página
actualizarRequeridoVendedor(); // ningún tipo marcado todavía: vendedor vuelve a ser obligatorio por defecto
restablecerVendedorDesconocido(); // checkbox desmarcado, select habilitado

// El botón "Pulisci" (type="reset") dispara el reset nativo del
// formulario, que limpia "Data" también. El evento "reset" se dispara
// ANTES de que el navegador limpie los campos (es la misma lógica que
// "submit"), así que hay que esperar al siguiente tick (setTimeout 0)
// para volver a poner la fecha de hoy después de que se vacíe.
// También hay que recalcular si el vendedor vuelve a ser obligatorio:
// reset() destilda los radio buttons y el checkbox, pero no toca por sí
// solo el atributo "required" ni el "disabled" que seteamos a mano.
formulario.addEventListener("reset", () => {
  setTimeout(() => {
    precargarFechaHoy();
    actualizarRequeridoVendedor();
    restablecerVendedorDesconocido();
  }, 0);
});

// antes del primer pintado: les asigna id a las pericias viejas que no
// lo tengan (ver migrarIdsSiHacenFalta más arriba)
migrarIdsSiHacenFalta();

// primer pintado, apenas carga la página
mostrarVistaPorDefecto();


// ============================================
// CERRAR MES
// Guarda un resumen (mes + total) como checkpoint informativo.
// YA NO vacía el detalle de pericias: "pericias" pasó a ser
// el registro único y permanente de todo el historial.
// ============================================
btnCerrarMes.addEventListener("click", (e) => {
  const confirmado = confirm("Sei sicuro di voler chiudere il mese?");
  if (!confirmado) {
    return;
  }

  let pericias;
  const guardado = localStorage.getItem("pericias");
  if (guardado === null) {
    pericias = [];
  } else {
    pericias = JSON.parse(guardado);
  }

  // arma el mes actual en formato "YYYY-MM"
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mesNumero = hoy.getMonth() + 1; // getMonth() da 0-11, se ajusta a 1-12
  const mesFormateado = String(mesNumero).padStart(2, "0"); // asegura 2 dígitos
  const mes = `${año}-${mesFormateado}`;

  // cuenta solo las pericias de ESTE mes (el array ya no se vacía,
  // así que hay que filtrar por fecha en vez de usar pericias.length)
  const periciasDeEsteMes = pericias.filter(function (pericia) {
    return pericia.fecha && pericia.fecha.startsWith(mes);
  });

  const resumen = { mes: mes, total: periciasDeEsteMes.length };

  let resumenMensual;
  const guardadoResumen = localStorage.getItem("resumenMensual");
  if (guardadoResumen === null) {
    resumenMensual = [];
  } else {
    resumenMensual = JSON.parse(guardadoResumen);
  }

  resumenMensual.push(resumen);
  localStorage.setItem("resumenMensual", JSON.stringify(resumenMensual));

  // NOTA: ya no se vacía "pericias" acá. El detalle completo se conserva.

  mostrarVistaPorDefecto();
});


// ============================================
// EXPORTAR CSV
// Arma un archivo de texto separado por comas
// con lo que esté actualmente visible en la tabla,
// y dispara la descarga con Blob + link simulado.
// ============================================
btnExportar.addEventListener("click", (e) => {
  let contenidoCSV = "Targa,Marca,Sede,Venditore,Data,Tipo,Note\n";

  for (const pericia of periciasVisibles) {
    contenidoCSV += `${pericia.targa},${pericia.brand},${pericia.concesionaria},${pericia.vendedor},${pericia.fecha},${pericia.tipo},${pericia.notas}\n`;
  }

  const blob = new Blob([contenidoCSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "pericias.csv";
  link.click();
});


// ============================================
// FILTROS Y BÚSQUEDA
// ============================================

// Vacía los 3 campos de filtro y vuelve a mostrar la vista por defecto.
limpiarFiltro.addEventListener("click", (e) => {
  const mesSeleccionado = document.getElementById("filtro-mese");
  const vendedorSeleccionado = document.getElementById("filtro-venditore");
  const tipoSeleccionado = document.getElementById("filtro-tipo");

  mesSeleccionado.value = "";
  vendedorSeleccionado.value = "";
  tipoSeleccionado.value = "";

  mostrarVistaPorDefecto();
});

// Filtro combinado: mes + vendedor + tipo, todos opcionales
// y combinados con lógica "Y" (deben cumplirse todos a la vez).
aplicaFiltro.addEventListener("click", (e) => {
  e.preventDefault();

  let pericias;
  const guardado = localStorage.getItem("pericias");
  if (guardado === null) {
    pericias = [];
  } else {
    pericias = JSON.parse(guardado);
  }

  const mesSeleccionado = document.getElementById("filtro-mese").value;
  const vendedorSeleccionado = document.getElementById("filtro-venditore").value;
  const tipoSeleccionado = document.getElementById("filtro-tipo").value;

  const periciasFiltradas = pericias.filter(function (pericia) {
    // si el filtro está vacío, la condición pasa siempre
    const cumpleTipo = tipoSeleccionado === "" || pericia.tipo === tipoSeleccionado;
    const cumpleVendedor = vendedorSeleccionado === "" || pericia.vendedor === vendedorSeleccionado;
    const cumpleMes = mesSeleccionado === "" || pericia.fecha.startsWith(mesSeleccionado);

    return cumpleTipo && cumpleVendedor && cumpleMes;
  });

  renderizarTabla(periciasFiltradas);
});

// Fuerza mayúsculas mientras se escribe la targa en el formulario, y
// limpia el aviso de autocompletado (si lo había) porque al seguir
// escribiendo la targa ya cambió y ese aviso queda desactualizado.
inputTarga.addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase();
  document.getElementById("targa-autocompletado").textContent = "";
});

// Al salir del campo targa (no mientras se escribe), busca si esa targa
// ya tiene una pericia previa y autocompleta marca/sede/vendedor con los
// datos de la más reciente. El tipo NUNCA se autocompleta a propósito:
// suele cambiar entre la primera carga y la segunda (issue #46).
inputTarga.addEventListener("blur", (e) => {
  const targa = e.target.value;
  const spanAutocompletado = document.getElementById("targa-autocompletado");
  spanAutocompletado.textContent = "";

  if (!targa) return;

  // si se está editando una pericia existente, los campos ya vienen
  // de esa pericia: no tiene sentido pisarlos con otra búsqueda
  if (idEditando !== null) return;

  let pericias;
  const guardado = localStorage.getItem("pericias");
  if (guardado === null) {
    pericias = [];
  } else {
    pericias = JSON.parse(guardado);
  }

  const ultimaPericia = buscarUltimaPericiaPorTarga(targa, pericias);
  if (!ultimaPericia) return;

  document.getElementById("brand").value = ultimaPericia.brand;
  document.getElementById("concesionaria").value = ultimaPericia.concesionaria;
  poblarVendedoresDeSede(ultimaPericia.concesionaria); // repuebla antes de asignar, si no el value no pega

  if (ultimaPericia.vendedor === VENDEDOR_DESCONOCIDO) {
    // la pericia anterior tampoco tenía vendedor: reflejamos lo mismo
    // en vez de intentar seleccionar un "Sconosciuto" que no es una
    // opción real del <select>
    inputVendedorDesconocido.checked = true;
    inputVendedor.disabled = true;
  } else {
    // por si quedó marcado de un autocompletado anterior (ej. el usuario
    // cambió de targa después de que se autocompletara una sin vendedor)
    inputVendedorDesconocido.checked = false;
    inputVendedor.disabled = false;
    document.getElementById("vendedor").value = ultimaPericia.vendedor;
  }
  // tanto .checked como el tipo pueden haber cambiado el required del
  // vendedor; marcar el checkbox a mano no dispara "change" por su cuenta
  actualizarRequeridoVendedor();

  spanAutocompletado.textContent = "Trovata una perizia precedente con questa targa: dati precompilati.";
});

// Búsqueda rápida por targa, filtrando en vivo mientras se escribe.
buscadorTarga.addEventListener("input", (e) => {
  let pericias;
  const guardado = localStorage.getItem("pericias");
  if (guardado === null) {
    pericias = [];
  } else {
    pericias = JSON.parse(guardado);
  }

  const periciasFiltradas = pericias.filter(function (pericia) {
    return pericia.targa.toUpperCase().includes(e.target.value.toUpperCase());
  });

  renderizarTabla(periciasFiltradas);
});


// ============================================
// ACCIONES SOBRE FILAS DE LA TABLA
// Un solo listener en el tbody (delegación de eventos),
// porque los botones se generan dinámicamente y no
// existen todavía cuando este script se ejecuta.
// ============================================
tbody.addEventListener("click", (e) => {
  // --- Eliminar ---
  if (e.target.classList.contains("btn-eliminar")) {
    const confirmado = confirm("Sei sicuro di voler eliminare questa perizia?");
    if (!confirmado) {
      return;
    }

    const id = e.target.dataset.id;

    let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }

    // se busca por id (no por posición): la tabla puede estar mostrando
    // las pericias ordenadas por fecha o filtradas, así que la posición
    // en pantalla no tiene por qué coincidir con la posición real acá
    const indexReal = pericias.findIndex((p) => p.id === id);
    if (indexReal === -1) return; // por si ya no existe (ej. doble click)

    pericias.splice(indexReal, 1);
    localStorage.setItem("pericias", JSON.stringify(pericias));
    mostrarVistaPorDefecto();
  }

  // --- Editar ---
  if (e.target.classList.contains("btn-editar")) {
    const id = e.target.dataset.id;

    let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }

    const pericia = pericias.find((p) => p.id === id);
    if (pericia === undefined) return; // por si ya no existe

    // carga los datos de esa pericia de vuelta en el formulario
    document.getElementById("targa").value = pericia.targa;
    document.getElementById("brand").value = pericia.brand;
    document.getElementById("concesionaria").value = pericia.concesionaria;
    poblarVendedoresDeSede(pericia.concesionaria); // repuebla antes de asignar, si no el value no pega

    if (pericia.vendedor === VENDEDOR_DESCONOCIDO) {
      inputVendedorDesconocido.checked = true;
      inputVendedor.disabled = true;
    } else {
      inputVendedorDesconocido.checked = false;
      inputVendedor.disabled = false;
      document.getElementById("vendedor").value = pericia.vendedor;
    }

    document.getElementById("fecha").value = pericia.fecha;
    document.getElementById("notas").value = pericia.notas;
    formulario.querySelector(`input[name="tipo"][value="${pericia.tipo}"]`).checked = true;
    // marcar el radio a mano (.checked = true) no dispara "change", así
    // que hay que recalcular el required del vendedor explícitamente
    // (si no, editar una demo vieja pediría un vendedor que no tiene)
    actualizarRequeridoVendedor();

    // marca que el próximo submit debe actualizar esta pericia, no crear una nueva
    idEditando = id;
  }
});


// ============================================
// GUARDAR PERICIA (submit del formulario)
// Valida cada campo con la Constraint Validation API,
// y si todo es válido, crea o actualiza la pericia
// en localStorage según idEditando.
// ============================================
formulario.addEventListener("submit", (e) => {
  e.preventDefault();

  let formularioValido = true;

  // recorre todos los campos del form y muestra un
  // mensaje de error específico por cada uno inválido
  for (const campo of formulario.elements) {
    if (campo.tagName === "BUTTON") continue;
    if (campo.type === "radio") continue;
    if (campo.type === "checkbox") continue; // "vendedor-desconocido": nunca obligatorio, no tiene span de error
    if (campo.id === "notas") continue; // opcional, nunca falla
    if (campo.tagName === "FIELDSET") continue; // no es un campo de datos

    const spanError = document.getElementById(`${campo.id}-error`);

    if (!campo.validity.valid) {
      let mensaje = "";

      if (campo.validity.valueMissing) {
        mensaje = "Questo campo è obbligatorio";
      } else if (campo.validity.patternMismatch) {
        mensaje = "Formato non valido";
      }
      formularioValido = false;
      spanError.textContent = mensaje;
    } else {
      spanError.textContent = "";
    }
  }

  // los radio buttons se manejan aparte del loop,
  // porque son un solo grupo lógico (name="tipo")
  const spanErrorTipo = document.getElementById("tipo-error");
  const algunTipoMarcado = formulario.querySelector('input[name="tipo"]:checked');

  if (!algunTipoMarcado) {
    spanErrorTipo.textContent = "Devi selezionare un tipo";
    formularioValido = false;
  } else {
    spanErrorTipo.textContent = "";
  }

  if (formularioValido) {
    const targa = document.getElementById("targa").value;
    const brand = document.getElementById("brand").value;
    const concesionaria = document.getElementById("concesionaria").value;
    // si está marcado "Non si conosce il venditore", el select está
    // deshabilitado (su valor no sirve); guardamos el valor fijo en su lugar
    const vendedor = inputVendedorDesconocido.checked
      ? VENDEDOR_DESCONOCIDO
      : document.getElementById("vendedor").value;
    const fecha = document.getElementById("fecha").value;
    const notas = document.getElementById("notas").value;
    const tipo = algunTipoMarcado.value;

    const pericia = {
      targa: targa,
      brand: brand,
      concesionaria: concesionaria,
      vendedor: vendedor,
      fecha: fecha,
      tipo: tipo,
      notas: notas,
    };

    let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }

    if (idEditando === null) {
      pericia.id = generarId(); // carga nueva
      pericias.push(pericia);
    } else {
      pericia.id = idEditando; // conserva el id original, no se reasigna al editar
      const indexReal = pericias.findIndex((p) => p.id === idEditando);
      if (indexReal !== -1) {
        pericias[indexReal] = pericia;
      }
    }

    localStorage.setItem("pericias", JSON.stringify(pericias));

    const spanCargaExitosa = document.getElementById("carga-exitosa");
    spanCargaExitosa.textContent = "Perizia salvata";

    mostrarVistaPorDefecto();
    formulario.reset();
    precargarFechaHoy(); // formulario.reset() vacía "Data"; la volvemos a poner en el día de hoy
    actualizarRequeridoVendedor(); // reset() destilda el tipo, pero no toca el "required" que seteamos a mano
    restablecerVendedorDesconocido(); // reset() destilda el checkbox, pero no reactiva el select deshabilitado
    idEditando = null; // vuelve a modo "carga nueva"
  }
});