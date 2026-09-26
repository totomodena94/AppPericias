// ============================================
// DATOS ESTÁTICOS
// Vendedores agrupados por sede/división.
// Todavía faltan cargar los de Via Appia.
// ============================================
const vendedoresPorSede = {
  "salaria-nuovo": ["Barcilli", "Terzuoli", "Rossi", "Rossi Sciarra", "Montecchi", "Panetta", "Scrima", "Pileggi", "Gutu", "Felli", "Geamana", "Antinucci", "Fratesi", "Miele", "Mari"],
  "salaria-usato": ["Grasso", "Corradini", "D'Angelo", "Pellini", "Serafini"],
  "appia-nuovo": [],
  "appia-usato": [],
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
// [nombre, cantidad], ordenado de mayor a menor.
const calcularPericiasPorVendedor = function (pericias) {
  const conteo = {};

  for (const pericia of pericias) {
    const nombreVendedor = pericia.vendedor;

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


// ============================================
// FUNCIONES DE RENDERIZADO
// Leen datos de localStorage (o reciben un array
// ya filtrado) y actualizan el DOM.
// Se declaran ANTES de usarse, porque se llaman
// apenas carga la página.
// ============================================

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

  // guarda lo que está actualmente visible, para que
  // el botón de exportar CSV sepa qué exportar
  periciasVisibles = pericias;

  let contenidoTabla = "";

  for (const [index, pericia] of pericias.entries()) {
    contenidoTabla += `
      <tr>
        <td>${pericia.targa}</td>
        <td>${pericia.brand}</td>
        <td>${pericia.concesionaria}</td>
        <td>${pericia.vendedor}</td>
        <td>${pericia.fecha}</td>
        <td>${pericia.tipo}</td>
        <td>${pericia.notas}</td>
        <td>
          <button class="btn-eliminar" data-index="${index}">Elimina</button>
          <button class="btn-editar" data-index="${index}">Edita</button>
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
};


// ============================================
// REFERENCIAS AL DOM Y ESTADO GLOBAL
// Se declaran una sola vez, al arrancar.
// ============================================
const tbody = document.querySelector("tbody");
const formulario = document.querySelector("form");
const buscadorTarga = document.getElementById("buscador-targa");
const inputTarga = document.getElementById("targa");
const aplicaFiltro = document.getElementById("btn-aplicar-filtros");
const limpiarFiltro = document.getElementById("btn-limpiar-filtros");
const btnExportar = document.getElementById("btn-exportar-csv");
const btnCerrarMes = document.getElementById("btn-cerrar-mes");
const inputImportarHistorico = document.getElementById("importar-historico");

let indiceEditando = null; // null = carga nueva; un número = editando esa posición del array
let periciasVisibles = []; // lo que está actualmente pintado en la tabla (todo o filtrado)

// primer pintado, apenas carga la página
mostrarVistaPorDefecto();


// ============================================
// IMPORTAR HISTÓRICO (CSV)
// Lee un archivo .csv elegido por el usuario y agrega
// cada fila como una pericia más dentro de "pericias".
// ============================================
inputImportarHistorico.addEventListener("change", (e) => {
  const archivo = e.target.files[0];
  if (!archivo) {
    return;
  }

  const lector = new FileReader();

  lector.onload = function (eventoLectura) {
    const contenido = eventoLectura.target.result;

    const lineas = contenido.split("\n").filter(function (linea) {
      return linea.trim() !== "";
    });

    const filasDeDatos = lineas.slice(1); // la primera línea es el encabezado

    let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }

    let importadas = 0;

    for (const linea of filasDeDatos) {
      const columnas = linea.split(",");

      const pericia = {
        targa: columnas[0],
        brand: columnas[1],
        concesionaria: columnas[2],
        vendedor: columnas[3],
        fecha: columnas[4],
        tipo: columnas[5],
        notas: columnas[6],
        esConversion: columnas[7] === "true",
        origen: columnas[8] ? columnas[8].trim() : "historico",
      };

      pericias.push(pericia);
      importadas += 1;
    }

    localStorage.setItem("pericias", JSON.stringify(pericias));
    mostrarVistaPorDefecto();

    alert(`Importazione completata: ${importadas} pericias agregadas.`);

    inputImportarHistorico.value = "";
  };

  lector.readAsText(archivo);
});


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

// Fuerza mayúsculas mientras se escribe la targa en el formulario.
inputTarga.addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase();
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

    const index = Number(e.target.dataset.index);

    let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }

    pericias.splice(index, 1); // saca 1 elemento en la posición "index"
    localStorage.setItem("pericias", JSON.stringify(pericias));
    mostrarVistaPorDefecto();
  }

  // --- Editar ---
  if (e.target.classList.contains("btn-editar")) {
    const index = Number(e.target.dataset.index);

    let pericias;
    const guardado = localStorage.getItem("pericias");
    if (guardado === null) {
      pericias = [];
    } else {
      pericias = JSON.parse(guardado);
    }

    const pericia = pericias[index];

    // carga los datos de esa pericia de vuelta en el formulario
    document.getElementById("targa").value = pericia.targa;
    document.getElementById("brand").value = pericia.brand;
    document.getElementById("concesionaria").value = pericia.concesionaria;
    document.getElementById("vendedor").value = pericia.vendedor;
    document.getElementById("fecha").value = pericia.fecha;
    document.getElementById("notas").value = pericia.notas;
    formulario.querySelector(`input[name="tipo"][value="${pericia.tipo}"]`).checked = true;

    // marca que el próximo submit debe actualizar esta posición, no crear una nueva
    indiceEditando = index;
  }
});


// ============================================
// GUARDAR PERICIA (submit del formulario)
// Valida cada campo con la Constraint Validation API,
// y si todo es válido, crea o actualiza la pericia
// en localStorage según indiceEditando.
// ============================================
formulario.addEventListener("submit", (e) => {
  e.preventDefault();

  let formularioValido = true;

  // recorre todos los campos del form y muestra un
  // mensaje de error específico por cada uno inválido
  for (const campo of formulario.elements) {
    if (campo.tagName === "BUTTON") continue;
    if (campo.type === "radio") continue;
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
    const vendedor = document.getElementById("vendedor").value;
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

    if (indiceEditando === null) {
      pericias.push(pericia); // carga nueva
    } else {
      pericias[indiceEditando] = pericia; // actualiza la existente
    }

    localStorage.setItem("pericias", JSON.stringify(pericias));

    const spanCargaExitosa = document.getElementById("carga-exitosa");
    spanCargaExitosa.textContent = "Perizia salvata";

    mostrarVistaPorDefecto();
    formulario.reset();
    indiceEditando = null; // vuelve a modo "carga nueva"
  }
});