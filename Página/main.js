(function(){
"use strict";

/* ---------------------------------------------------------------
   Configuración
   --------------------------------------------------------------- */
/* Configuración: config.js la define en window.AVALIAN. Si ese archivo no
   está, o si falta alguna clave, se usan estos valores por defecto.
   También se puede probar otro número sin tocar nada agregando
   ?wa=549XXXXXXXXXX a la URL. */
var CFG = window.AVALIAN || {};
var qs = new URLSearchParams(location.search);
var WA = (qs.get("wa") || CFG.whatsapp || "5491135787577").replace(/\D/g, "");
var TEL_VISIBLE = CFG.telefonoVisible || "11 3578-7577";
var EMAIL       = CFG.email || "info@mimedicinaprepaga.com.ar";
var HORARIO     = CFG.horario || "de lunes a viernes de 9 a 19 h";
var URGENCIAS   = CFG.urgencias || "0800-555-5556";
var APORTE = CFG.aporteEfectivo != null ? CFG.aporteEfectivo : 7.65;   // % del bruto que llega a Avalian
var PLANES = [
  {n:"Cerca",    bit:1,  sub:"Cartilla de tu zona", color:"#B7E04B"},
  {n:"Hoy",      bit:2,  sub:"Entrada con copagos", color:"#3FBF72"},
  {n:"Integral", bit:4,  sub:"El más elegido",      color:"#00996B"},
  {n:"Superior", bit:8,  sub:"Sin copagos",         color:"#2E7FA3"},
  {n:"Selecta",  bit:16, sub:"Cartilla completa",   color:"#123B63"}
];
function colorDe(mask){
  for(var i=0;i<PLANES.length;i++){ if(mask & PLANES[i].bit) return PLANES[i].color; }
  return PLANES[0].color;
}
var ZONAS = [
  {n:"CABA", bit:1}, {n:"Zona Norte", bit:2}, {n:"Zona Noroeste", bit:4},
  {n:"Zona Oeste", bit:8}, {n:"Zona Sur", bit:16},
  {n:"La Plata", bit:32}, {n:"Luján", bit:64}, {n:"Zárate y Campana", bit:128}
];

var $  = function(s,c){ return (c||document).querySelector(s); };
var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
var reduce = function(){ return window.matchMedia("(prefers-reduced-motion: reduce)").matches; };
function waUrl(m){ return "https://wa.me/"+WA+"?text="+encodeURIComponent(m); }
function norm(s){
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
}

/* ---------------------------------------------------------------
   Enlaces de WhatsApp
   --------------------------------------------------------------- */
$$(".wa").forEach(function(a){
  a.href = waUrl(a.dataset.msg || "Hola, quiero asesoramiento sobre Avalian.");
  a.target = "_blank"; a.rel = "noopener";
});
$("#anio").textContent = "© " + new Date().getFullYear();

/* ---------------------------------------------------------------
   Datos de contacto, tomados de config.js
   --------------------------------------------------------------- */
function soloDigitos(s){ return (s || "").replace(/\D/g, ""); }
$$(".cfg-tel").forEach(function(el){
  el.href = waUrl(el.dataset.msg || "Hola, quiero asesoramiento sobre los planes de Avalian.");
  el.target = "_blank";
  el.rel = "noopener";
  var svg = el.querySelector("svg");
  if(svg){ el.innerHTML = svg.outerHTML + "\n            " + TEL_VISIBLE; }
  else { el.textContent = TEL_VISIBLE; }
});
$$(".cfg-mail").forEach(function(el){
  el.href = "mailto:" + EMAIL;
  var svg = el.querySelector("svg");
  if(svg){ el.innerHTML = svg.outerHTML + "\n            " + EMAIL; }
  else { el.textContent = EMAIL; }
});
$$(".cfg-urgencias").forEach(function(el){
  el.href = "tel:" + soloDigitos(URGENCIAS);
  el.textContent = URGENCIAS;
});
$$(".cfg-horario").forEach(function(el){ el.textContent = HORARIO; });

/* ---------------------------------------------------------------
   Header y menú
   --------------------------------------------------------------- */
var header = $("#header");
function alScroll(){ header.classList.toggle("pegado", window.scrollY > 10); }
alScroll(); window.addEventListener("scroll", alScroll, {passive:true});

var burger = $("#hamburguesa"), panel = $("#panel"), velo = $("#velo");
function abrirPanel(v){
  burger.setAttribute("aria-expanded", String(v));
  burger.setAttribute("aria-label", v ? "Cerrar menú" : "Abrir menú");
  panel.classList.toggle("abierto", v);
  panel.setAttribute("aria-hidden", String(!v));
  velo.classList.toggle("abierto", v);
  document.body.style.overflow = v ? "hidden" : "";
  if(v){ var p = panel.querySelector(".link"); if(p) p.focus({preventScroll:true}); }
}
burger.addEventListener("click", function(){ abrirPanel(burger.getAttribute("aria-expanded") !== "true"); });
$("#panelCerrar").addEventListener("click", function(){ abrirPanel(false); burger.focus(); });
velo.addEventListener("click", function(){ abrirPanel(false); });
$$(".panel a").forEach(function(a){ a.addEventListener("click", function(){ abrirPanel(false); }); });
document.addEventListener("keydown", function(e){
  if(e.key === "Escape" && panel.classList.contains("abierto")){ abrirPanel(false); burger.focus(); }
});

/* ---------------------------------------------------------------
   Buscador de cartilla
   --------------------------------------------------------------- */
var INDICE = CARTILLA.map(function(r){ return {n:r[0], p:r[1], z:r[2], k:norm(r[0])}; });
$("#nTotal").textContent = INDICE.length;

var elQ = $("#q"), elRes = $("#resultados"), elDet = $("#detalle");

function planesDe(mask){
  return PLANES.filter(function(p){ return mask & p.bit; });
}
function zonasDe(mask){
  return ZONAS.filter(function(z){ return mask & z.bit; }).map(function(z){ return z.n; });
}
function pintarPills(mask){
  if(!mask) return "";
  return PLANES.map(function(p){
    return '<span class="pill'+((mask & p.bit) ? ' si' : '')+'">'+p.n+'</span>';
  }).join("");
}

function buscar(texto){
  var k = norm(texto);
  elDet.classList.remove("on");
  if(k.length < 2){ elRes.innerHTML = ""; return; }
  var exactos = [], parciales = [];
  INDICE.forEach(function(it){
    var i = it.k.indexOf(k);
    if(i === 0) exactos.push(it);
    else if(i > 0) parciales.push(it);
  });
  var lista = exactos.concat(parciales).slice(0, 12);
  if(!lista.length){
    var busca = texto.trim();
    elRes.innerHTML = '<div class="vacio">'+
      '<b>No figura en esta lista.</b>'+
      'La cartilla completa de Avalian es más amplia que lo que tengo cargado acá e incluye todo el país. Consultame y lo verifico contra la cartilla actualizada, normalmente el mismo día.'+
      '<div class="acc">'+
        '<a class="btn btn-lima" target="_blank" rel="noopener" href="'+
          waUrl('Hola, quiero saber si "'+busca+'" está en la cartilla de Avalian y en qué planes.')+
        '">Consultar por ' + (busca.length > 22 ? busca.slice(0,22)+"…" : busca) + '</a>'+
        '<a class="btn btn-linea" href="#cotizar">Pedir mi cotización</a>'+
      '</div>'+
    '</div>';
    return;
  }
  elRes.innerHTML = lista.map(function(it, i){
    return '<button class="res" type="button" style="--c:'+colorDe(it.p)+'" data-i="'+INDICE.indexOf(it)+'">'+
      '<span class="res-nombre">'+it.n+'</span>'+
      '<span class="res-planes">'+pintarPills(it.p)+'</span>'+
      '<span class="res-zona">'+zonasDe(it.z).join(" · ")+'</span>'+
    '</button>';
  }).join("");
}

function mostrarDetalle(it){
  var incluidos = planesDe(it.p);
  var minimo = incluidos[0];
  var texto;
  if(!incluidos.length){
    texto = "Figura en la cartilla de tu zona. Escribime y te confirmo en qué planes entra contra la cartilla actualizada.";
  } else if(incluidos.length === PLANES.length){
    texto = "Está en los cinco planes, así que podés entrar por el más económico y seguir atendiéndote ahí.";
  } else if(minimo){
    texto = "El plan más económico que lo incluye es " + minimo.n + ". También está en " +
      incluidos.slice(1).map(function(p){ return p.n; }).join(", ") + ".";
    if(incluidos.length === 1) texto = "Dentro de los planes principales, figura solo en " + minimo.n + ".";
  }
  elDet.innerHTML =
    '<span class="nom">'+it.n+'</span>'+
    '<p>'+texto+' Zonas donde figura: '+zonasDe(it.z).join(", ")+'.</p>'+
    '<div class="acc">'+
      '<a class="btn" href="#cotizar" data-cerrar="1">'+(minimo ? "Cotizar el plan "+minimo.n : "Pedir mi cotización")+'</a>'+
      '<a class="btn btn-linea" target="_blank" rel="noopener" href="'+
        waUrl("Hola, me atiendo en "+it.n+". ¿Qué plan de Avalian me conviene para no perder ese prestador?")+
      '">Consultar por este prestador</a>'+
    '</div>';
  elDet.classList.add("on");
  var notas = $("#notas");
  if(notas && !notas.value) notas.value = "Me atiendo en " + it.n + ".";
  $("#zona") && (function(){
    var mapa = {1:"CABA",2:"GBA Norte",4:"GBA Noroeste",8:"GBA Oeste",16:"GBA Sur"};
    var sel = $("#zona");
    if(!sel.value){
      for(var b in mapa){ if(it.z & b){ sel.value = mapa[b]; break; } }
    }
  })();
}

elQ.addEventListener("input", function(){ buscar(elQ.value); });
elRes.addEventListener("click", function(e){
  var b = e.target.closest(".res");
  if(!b) return;
  mostrarDetalle(INDICE[+b.dataset.i]);
  elDet.scrollIntoView({behavior: reduce() ? "auto" : "smooth", block:"nearest"});
});

var SUGES = ["Hospital Italiano","Hospital Británico","FLENI","Sanatorio Güemes","Clínica Bazterrica","Hospital Universitario Austral"];
$("#sugerencias").innerHTML = SUGES.map(function(s){ return '<button type="button">'+s+'</button>'; }).join("");
$("#sugerencias").addEventListener("click", function(e){
  if(e.target.tagName !== "BUTTON") return;
  elQ.value = e.target.textContent;
  buscar(elQ.value);
  elQ.focus();
});

/* ---------------------------------------------------------------
   Comparador de planes
   valores en orden: Cerca · Hoy · Integral · Superior · Selecta
   --------------------------------------------------------------- */
var FILAS = [
  {g:"Consultas, estudios y tratamientos"},
  {t:"Consulta médica en consultorio", v:["Con copago","Con copago, bonificado los primeros 12 meses","Con copago; sin copago en la variante AS200SC","Sin copago","Sin copago"], d:[3,4]},
  {t:"Telemedicina E·doc, 24 horas", v:["Con copago","Sin copago","Según variante","Sin copago","Sin copago"], d:[1,3,4]},
  {t:"Análisis e imágenes, baja y alta complejidad", v:["Con copago","Con copago","Según variante","Sin copago","Sin copago"], d:[3,4]},
  {t:"Medicamentos en farmacia", v:["40%","40%","40%","40%","50% o 75% según variante"], d:[4]},
  {t:"Odontología, consulta y tratamiento", v:["Con copago","Con copago","Según variante","Sin copago","Sin copago"], d:[3,4]},
  {t:"Ortodoncia, por única vez", v:["De 5 a 17 años","De 5 a 35 años","De 5 a 30 años","De 5 a 35 años","De 5 a 50 años"], d:[4]},
  {t:"Implantes y prótesis dentales", v:["Sin cobertura","Sin cobertura","Sin cobertura","Sin cobertura","A valor Avalian según plan"], d:[4]},
  {t:"Kinesiología por año", v:["25 sesiones","40 sesiones","40 sesiones","45 sesiones","50 u 80 sesiones"], d:[3,4]},
  {t:"Fonoaudiología por año", v:["25 sesiones","30 sesiones","30 sesiones","35 sesiones","40 o 70 sesiones"], d:[3,4]},
  {t:"Psicoterapia por año", v:["30 sesiones, 4 por mes","30 sesiones; virtual sin copago","48 sesiones","48 sesiones","48 sesiones"], d:[2,3,4]},
  {t:"Óptica", v:["Cristales al 50%, sin armazón ni lentes de contacto","Reintegro de monto fijo","Reintegro de monto fijo","Reintegro de monto fijo","Reintegro de monto fijo"]},

  {g:"Internación"},
  {t:"Tipo de habitación", v:["Compartida","Individual","Individual","Individual","Individual"], d:[1,2,3,4]},
  {t:"Internación clínica y quirúrgica de alta complejidad", v:["100%, sin tope ni límite","100%, sin tope ni límite","100%, sin tope ni límite","100%, sin tope ni límite","100%, sin tope ni límite"]},
  {t:"Parto y terapia intensiva neonatal", v:["100%, sin tope","100%, sin tope","100%, sin tope","100%, sin tope","100%, sin tope"]},
  {t:"Acompañante en internación", v:["100% hasta los 15 años","100% hasta los 15 años","100% hasta los 15 años","100% hasta los 15 años","100% hasta los 15 años"]},
  {t:"Prótesis quirúrgicas importadas", v:["Solo prótesis nacionales","40% del presupuesto más bajo","40% del presupuesto más bajo","50% del presupuesto más bajo","60% o 75% del presupuesto más bajo"], d:[3,4]},

  {g:"Otros servicios"},
  {t:"Trasplantes, diálisis y medicación oncológica", v:["100% según el PMO","100% según el PMO","100% según el PMO","100% según el PMO","100% según el PMO"]},
  {t:"Asistencia al viajero", v:["Regional: Argentina y países limítrofes","Nacional e internacional","Con Universal Assistance","Internacional","Internacional"], d:[1,3,4]},
  {t:"Médico a domicilio", v:["Módulo opcional con cargo","Módulo opcional con cargo","Módulo opcional con cargo","Con coseguro","Sin cargo"], d:[4]},
  {t:"Urgencias y emergencias a domicilio", v:["Sí, según la zona","Sí, según la zona","Sí, según la zona","Sí, según la zona","Sí, según la zona"]},
  {t:"Reintegros fuera de cartilla", v:["No","No","No","No","Sí, según valores Avalian"], d:[4]},
  {t:"Cirugía refractiva, desde los 12 meses", v:["Sin cobertura","Subsidio según normas Avalian","Subsidio según normas Avalian","Subsidio según normas Avalian","Subsidio según normas Avalian"], d:[1,2,3,4]},
  {t:"Cirugía estética", v:["Sin cobertura","Sin cobertura","Sin cobertura","Sin cobertura","Un área quirúrgica cada 3 años"], d:[4]}
];

var chico = window.matchMedia("(max-width: 699px)").matches;
var visibles = chico ? [0,2] : [0,1,2,3,4];

$("#filtrosPlan").innerHTML = PLANES.map(function(p,i){
  return '<button type="button" data-i="'+i+'" aria-pressed="'+(visibles.indexOf(i)>-1)+'">'+p.n+'</button>';
}).join("");

function pintarTabla(){
  var cab = '<th scope="col">Prestación</th>' + visibles.map(function(i){
    return '<th scope="col">'+PLANES[i].n+'<small>'+PLANES[i].sub+'</small></th>';
  }).join("");
  $("#cabecera").innerHTML = cab;

  var soloDif = $("#soloDif").checked;
  var html = FILAS.map(function(f){
    if(f.g){
      return '<tr class="grupo"><th scope="colgroup">'+f.g+'</th>'+
        visibles.map(function(){ return "<td></td>"; }).join("")+'</tr>';
    }
    var vals = visibles.map(function(i){ return f.v[i]; });
    var iguales = vals.every(function(v){ return v === vals[0]; });
    if(soloDif && iguales) return "";
    return '<tr><th scope="row">'+f.t+'</th>'+ visibles.map(function(i){
      var destaca = f.d && f.d.indexOf(i) > -1 && !iguales;
      return '<td class="'+(destaca?"destaca":"")+'">'+f.v[i]+'</td>';
    }).join("") + '</tr>';
  }).join("");
  $("#cuerpo").innerHTML = html;
}

$("#filtrosPlan").addEventListener("click", function(e){
  var b = e.target.closest("button");
  if(!b) return;
  var i = +b.dataset.i, pos = visibles.indexOf(i);
  if(pos > -1){
    if(visibles.length === 2) return;           // siempre al menos dos columnas
    visibles.splice(pos,1);
  } else {
    visibles.push(i); visibles.sort(function(a,b){ return a-b; });
  }
  b.setAttribute("aria-pressed", String(visibles.indexOf(i) > -1));
  pintarTabla();
});
$("#soloDif").addEventListener("change", pintarTabla);
pintarTabla();

/* ---------------------------------------------------------------
   Cartilla por zona
   --------------------------------------------------------------- */
var zonaActiva = 1;
var expandida = false;
$("#zonasBtns").innerHTML = ZONAS.map(function(z){
  return '<button type="button" data-bit="'+z.bit+'" aria-pressed="'+(z.bit===1)+'">'+z.n+'</button>';
}).join("");

function pintarZona(){
  var enZona = INDICE.filter(function(it){ return it.z & zonaActiva; });
  $("#conteo").innerHTML = PLANES.map(function(p){
    var n = enZona.filter(function(it){ return it.p & p.bit; }).length;
    return '<div style="--c:'+p.color+'"><b>'+n+'</b><span>en '+p.n+'</span></div>';
  }).join("");

  var nombreZona = ZONAS.filter(function(z){ return z.bit === zonaActiva; })[0].n;
  $("#zonaResumen").innerHTML = "Tengo <b>"+enZona.length+"</b> centros cargados en "+nombreZona+".";

  var orden = enZona.slice().sort(function(a,b){ return a.n.localeCompare(b.n,"es"); });
  var tope = expandida ? orden.length : (chico ? 18 : 30);
  $("#nube").innerHTML = orden.slice(0, tope).map(function(it){
    var tit = it.p ? "Está en: "+planesDe(it.p).map(function(p){return p.n;}).join(", ") : it.n;
    return '<span style="--c:'+colorDe(it.p)+'" title="'+tit+'">'+it.n+'</span>';
  }).join("");
  $("#verMas").innerHTML = orden.length > tope
    ? '<button type="button">Ver los '+(orden.length-tope)+' centros restantes</button>'
    : (expandida && orden.length > (chico?18:30) ? '<button type="button" data-menos="1">Ver menos</button>' : "");
}
$("#verMas").addEventListener("click", function(e){
  if(e.target.tagName !== "BUTTON") return;
  expandida = !e.target.dataset.menos;
  pintarZona();
});
$("#zonasBtns").addEventListener("click", function(e){
  var b = e.target.closest("button");
  if(!b) return;
  zonaActiva = +b.dataset.bit; expandida = false;
  $$("#zonasBtns button").forEach(function(x){ x.setAttribute("aria-pressed", String(+x.dataset.bit === zonaActiva)); });
  pintarZona();
});
pintarZona();

/* ---------------------------------------------------------------
   Simulador de aportes
   --------------------------------------------------------------- */
var modo = "dep";
var fmt = new Intl.NumberFormat("es-AR", {maximumFractionDigits:0});
var elMonto = $("#monto"), elPareja = $("#sumaPareja");

var soloNumeros = soloDigitos;
function calcular(){
  var base = parseInt(soloNumeros(elMonto.value), 10) || 0;
  var multiplicador = elPareja.checked ? 2 : 1;
  var neto = modo === "dep" ? base * (APORTE/100) * multiplicador : base * multiplicador;

  $("#resultado").textContent = "$" + fmt.format(Math.round(neto));
  $("#explica").textContent = neto > 0
    ? "Se descuenta de la cuota del plan que elijas. Escribime y te paso la diferencia exacta a pagar."
    : "Cargá un monto y te muestro cuánto de la cuota queda cubierto por tus aportes.";
}
elMonto.addEventListener("input", function(){
  var n = soloNumeros(elMonto.value);
  elMonto.value = n ? fmt.format(parseInt(n,10)) : "";
  calcular();
});
elPareja.addEventListener("change", calcular);

function setModo(m){
  modo = m;
  $("#modoDep").setAttribute("aria-pressed", String(m === "dep"));
  $("#modoMono").setAttribute("aria-pressed", String(m === "mono"));
  if(m === "dep"){
    $("#lblMonto").textContent = "Tu sueldo bruto mensual";
    $("#hintMonto").textContent = "El bruto, antes de los descuentos del recibo.";
    elMonto.placeholder = "1.500.000";
    elPareja.parentNode.style.display = "";
  } else {
    $("#lblMonto").textContent = "Aporte de obra social de tu monotributo";
    $("#hintMonto").textContent = "El componente de obra social que figura en tu credencial de pago mensual.";
    elMonto.placeholder = "40.000";
    elPareja.checked = false;
    elPareja.parentNode.style.display = "none";
  }
  calcular();
}
$("#modoDep").addEventListener("click", function(){ setModo("dep"); });
$("#modoMono").addEventListener("click", function(){ setModo("mono"); });
calcular();

/* ---------------------------------------------------------------
   Preguntas frecuentes
   --------------------------------------------------------------- */
$$("#listaPreguntas > .pregunta > button").forEach(function(btn){
  btn.addEventListener("click", function(){
    var item = btn.parentNode, abierta = item.classList.contains("abierta");
    $$("#listaPreguntas > .pregunta").forEach(function(o){
      o.classList.remove("abierta");
      o.querySelector("button").setAttribute("aria-expanded","false");
    });
    if(!abierta){ item.classList.add("abierta"); btn.setAttribute("aria-expanded","true"); }
  });
});

/* ---------------------------------------------------------------
   Navegación activa
   --------------------------------------------------------------- */
var links = $$("#menu a");
var secciones = links.map(function(a){ return $(a.getAttribute("href")); }).filter(Boolean);
if("IntersectionObserver" in window && secciones.length){
  var io = new IntersectionObserver(function(entradas){
    entradas.forEach(function(en){
      if(!en.isIntersecting) return;
      links.forEach(function(a){ a.classList.toggle("activo", a.getAttribute("href") === "#"+en.target.id); });
    });
  }, {rootMargin:"-45% 0px -50% 0px", threshold:0});
  secciones.forEach(function(s){ io.observe(s); });
}

/* ---------------------------------------------------------------
   Formulario
   --------------------------------------------------------------- */
var ficha = $("#ficha");
function marcar(el, ok){ el.closest(".item").classList.toggle("mal", !ok); return ok; }
function validar(){
  var ok = true;
  ok = marcar($("#nombre"), $("#nombre").value.trim().length >= 3) && ok;
  ok = marcar($("#tel"), soloNumeros($("#tel").value).length >= 8) && ok;
  ok = marcar($("#aporte"), $("#aporte").value !== "") && ok;
  ok = marcar($("#grupo"), $("#grupo").value !== "") && ok;
  var e = parseInt($("#edad").value, 10);
  ok = marcar($("#edad"), !isNaN(e) && e >= 0 && e <= 99) && ok;
  ok = marcar($("#zona"), $("#zona").value !== "") && ok;
  return ok;
}
$$("#ficha input, #ficha select").forEach(function(el){
  el.addEventListener("blur", function(){ if(el.closest(".item").classList.contains("mal")) validar(); });
});
ficha.addEventListener("submit", function(ev){
  ev.preventDefault();
  if(!validar()){
    var primero = $(".item.mal input, .item.mal select");
    if(primero) primero.focus();
    return;
  }
  var v = function(id){ return $("#"+id).value.trim(); };
  var aporteSim = soloNumeros(elMonto.value)
    ? "\nAporte que se deriva: " + $("#resultado").textContent + " por mes"
    : "";
  var texto = "Hola, quiero cotizar un plan de Avalian.\n\n" +
    "Nombre: " + v("nombre") + "\n" +
    "Teléfono: " + v("tel") + "\n" +
    "Edad: " + v("edad") + "\n" +
    "Grupo: " + v("grupo") + "\n" +
    "Aportes: " + v("aporte") + aporteSim + "\n" +
    "Zona: " + v("zona") +
    (v("notas") ? "\n\n" + v("notas") : "");
  window.open(waUrl(texto), "_blank", "noopener");
  $("#enviado").classList.add("on");
  ficha.reset();
});

})();

