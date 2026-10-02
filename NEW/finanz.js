document.addEventListener('DOMContentLoaded', function () {

  const $ = function (id) { return document.getElementById(id); };

  const formatearMoneda = function (n) {
    return (Number(n) || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  };

  const CalculadoraFinanciera = {
    calcularDisponibilidad: function (i, g) { return i - g; },
    calcularCapacidadAhorro: function (i, g) { return i < g ? 0 : i - g; },
    calcularMesesParaMeta: function (m, a) {
      if (a <= 0) throw new Error('El ahorro mensual debe ser positivo');
      return Math.round((m / a) * 10) / 10;
    },
    calcularMesesReales: function (m, a) {
      return a <= 0 ? Infinity : Math.ceil(m / a);
    }
  };

  const Validador = {
    esMontoPositivo: function (v) { return typeof v === 'number' && !isNaN(v) && v > 0; },
    esIngresoValido: function (v) { return typeof v === 'number' && !isNaN(v) && v >= 0; },
    esTextoNoVacio: function (t) { return typeof t === 'string' && t.trim().length > 0; }
  };

  const Repositorio = {
    guardarPerfil: function (p) { localStorage.setItem('finanz_perfil', JSON.stringify(p)); },
    obtenerPerfil: function () { return JSON.parse(localStorage.getItem('finanz_perfil') || 'null'); },
    guardarMetas: function (m) { localStorage.setItem('finanz_metas', JSON.stringify(m)); },
    obtenerMetas: function () { return JSON.parse(localStorage.getItem('finanz_metas') || '[]'); }
  };

  let perfil = Repositorio.obtenerPerfil() || { ingresoMensual: 0, gastos: {} };
  let metas = Repositorio.obtenerMetas();

  function mostrarVista(nombreVista) {
    document.querySelectorAll('.view').forEach(function (v) {
      v.classList.remove('active');
    });
    const destino = $('view-' + nombreVista);
    if (destino) destino.classList.add('active');

    document.querySelectorAll('.bottom-nav button').forEach(function (b) {
      if (b.dataset.view === nombreVista) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  const nav = document.querySelector('.bottom-nav');
  if (nav) {
    nav.addEventListener('click', function (e) {
      const boton = e.target.closest('button[data-view]');
      if (!boton) return;
      mostrarVista(boton.dataset.view);
    });
  }

  function totalGastos() {
    return Object.values(perfil.gastos || {}).reduce(function (a, b) {
      return a + (Number(b) || 0);
    }, 0);
  }

  function renderDashboard() {
    const ingreso = Number(perfil.ingresoMensual) || 0;
    const gastos = totalGastos();
    const disponible = CalculadoraFinanciera.calcularDisponibilidad(ingreso, gastos);
    const capacidad = CalculadoraFinanciera.calcularCapacidadAhorro(ingreso, gastos);

    if ($('total-ingresos')) $('total-ingresos').textContent = formatearMoneda(ingreso);
    if ($('total-gastos')) $('total-gastos').textContent = formatearMoneda(gastos);
    if ($('disponible')) $('disponible').textContent = formatearMoneda(disponible);
    if ($('capacidad-ahorro')) $('capacidad-ahorro').textContent = formatearMoneda(capacidad);

    const msg = $('mensaje-ahorro');
    if (!msg) return;

    if (capacidad === 0 && ingreso > 0) {
      msg.textContent = 'Tus gastos igualan o superan tus ingresos. No hay capacidad de ahorro.';
      msg.style.color = 'var(--expense)';
    } else if (capacidad === 0) {
      msg.textContent = 'Registra tu estudio socioeconomico para ver tu capacidad.';
      msg.style.color = 'var(--muted)';
    } else {
      msg.textContent = 'Puedes destinar hasta ' + formatearMoneda(capacidad) + ' al ahorro cada mes.';
      msg.style.color = 'var(--income)';
    }
  }

  function renderMetas() {
    const lista = $('lista-metas');
    if (!lista) return;
    lista.innerHTML = '';

    const capacidad = CalculadoraFinanciera.calcularCapacidadAhorro(
      Number(perfil.ingresoMensual) || 0,
      totalGastos()
    );

    metas.forEach(function (meta, i) {
      let tiempoTexto = 'Sin datos';
      if (capacidad > 0) {
        const meses = CalculadoraFinanciera.calcularMesesParaMeta(meta.monto, capacidad);
        tiempoTexto = meses + ' meses (aprox.)';
      } else {
        tiempoTexto = 'Sin capacidad de ahorro';
      }

      const li = document.createElement('li');
      li.className = 'tx-item';
      li.innerHTML =
        '<div class="tx-info">' +
          '<span class="tx-desc">' + meta.nombre + '</span>' +
          '<span class="tx-cat">' + meta.plazo + ' - ' + formatearMoneda(meta.monto) + '</span>' +
          '<span class="tx-cat">Tiempo estimado: ' + tiempoTexto + '</span>' +
        '</div>' +
        '<span class="tx-amount expense" data-eliminar="' + i + '" style="cursor:pointer">X</span>';
      lista.appendChild(li);
    });

    if ($('metas-empty')) {
      $('metas-empty').style.display = metas.length ? 'none' : 'block';
    }
  }

  function renderPerfil() {
    if ($('ingreso') && perfil.ingresoMensual) {
      $('ingreso').value = perfil.ingresoMensual;
    }
    document.querySelectorAll('[data-gasto]').forEach(function (input) {
      const cat = input.dataset.gasto;
      if (perfil.gastos && perfil.gastos[cat] !== undefined) {
        input.value = perfil.gastos[cat];
      }
    });
  }

  renderDashboard();
  renderMetas();
  renderPerfil();

  const formPerfil = $('form-perfil');
  if (formPerfil) {
    formPerfil.addEventListener('submit', function (e) {
      e.preventDefault();
      const ingreso = parseFloat($('ingreso').value) || 0;
      if (!Validador.esIngresoValido(ingreso)) {
        alert('El ingreso debe ser un numero mayor o igual a cero.');
        return;
      }
      const gastos = {};
      document.querySelectorAll('[data-gasto]').forEach(function (input) {
        gastos[input.dataset.gasto] = parseFloat(input.value) || 0;
      });
      perfil = { ingresoMensual: ingreso, gastos: gastos };
      Repositorio.guardarPerfil(perfil);
      renderDashboard();
      alert('Estudio socioeconomico guardado.');
      mostrarVista('dashboard');
    });
  }

  const formMeta = $('form-meta');
  if (formMeta) {
    formMeta.addEventListener('submit', function (e) {
      e.preventDefault();
      const nombre = $('meta-nombre').value.trim();
      const monto = parseFloat($('meta-monto').value);
      const plazo = $('meta-plazo').value;

      if (!Validador.esTextoNoVacio(nombre)) { alert('Escribe un nombre para la meta.'); return; }
      if (!Validador.esMontoPositivo(monto)) { alert('El monto debe ser mayor a cero.'); return; }

      metas.push({ nombre: nombre, monto: monto, plazo: plazo, fecha: new Date().toISOString() });
      Repositorio.guardarMetas(metas);
      e.target.reset();
      renderMetas();
    });
  }

  const listaMetas = $('lista-metas');
  if (listaMetas) {
    listaMetas.addEventListener('click', function (e) {
      const idx = e.target.dataset.eliminar;
      if (idx !== undefined) {
        if (confirm('Eliminar esta meta?')) {
          metas.splice(Number(idx), 1);
          Repositorio.guardarMetas(metas);
          renderMetas();
        }
      }
    });
  }

  const btnSimular = $('btn-simular');
  if (btnSimular) {
    btnSimular.addEventListener('click', function () {
      const nuevoAhorro = parseFloat($('sim-ahorro').value) || 0;
      const resultado = $('resultado-sim');
      if (!resultado) return;

      if (nuevoAhorro <= 0) {
        resultado.innerHTML = '<span class="warn">Ingresa un ahorro mensual mayor a cero.</span>';
        return;
      }
      if (metas.length === 0) {
        resultado.innerHTML = '<span class="warn">Primero registra al menos una meta.</span>';
        return;
      }

      let html = '<p>Con un ahorro de <strong>' + formatearMoneda(nuevoAhorro) + '</strong> al mes:</p><ul>';
      metas.forEach(function (meta) {
        const meses = CalculadoraFinanciera.calcularMesesReales(meta.monto, nuevoAhorro);
        html += '<li>' + meta.nombre + ': <span class="ok">' + meses + ' meses</span></li>';
      });
      html += '</ul>';
      resultado.innerHTML = html;
    });
  }

  const btnTheme = $('btn-theme');
  if (btnTheme) {
    btnTheme.addEventListener('click', function () {
      document.body.classList.toggle('light');
      const isLight = document.body.classList.contains('light');
      btnTheme.textContent = isLight ? 'Claro' : 'Oscuro';
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }

  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
    if (btnTheme) btnTheme.textContent = 'Claro';
  }
});