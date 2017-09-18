var top15_estaciones = [];
var contaminante;

function get_top9(parametro,horas,minPromedio,maxValor) {
    //datos de configuracion
    // var horas = 24;
    // var minPromedio = 12;
    // var maxValor = 152;

    //limpiar variables y contenedor
    contaminante = parametro;
    top15_estaciones = [];
    $('.cont').html('');
    var maxMax = 0;

    const dActual = new Date();
    var dPasada = new Date();
    dPasada.setHours(restaHoras(dActual,horas));


    var url = "https://api.datos.gob.mx/v1/sinaica?parametro="+parametro+"&pageSize=12000&date-insert=[range:"+getFormatDateAPI(dPasada)+"%7C"+getFormatDateAPI(dActual)+"] ";

    $.ajax({
      type: 'GET',
      url:url,
      data: {},
      success: function( data, textStatus, jqxhr ) {
        var agrupaEstaciones  = [];
        var indEstaciones     = [];
        var indPromedios      = [];

        //Agrupamos los registros por estacion
        for (var i = 0; i < data.results.length; i++) {

          if(!Array.isArray(agrupaEstaciones[data.results[i].estacionesid])){
            agrupaEstaciones[data.results[i].estacionesid] = [];
            indEstaciones.push(data.results[i].estacionesid);
          }

          //validacion desde el api para valores correctos
          if(data.results[i].validoorig == 1 && maxValor > data.results[i].valororig){
            agrupaEstaciones[data.results[i].estacionesid].push(data.results[i]);
          }
        }

        //sacamos los promedios de cada estacion para que sean evaluados
        for (var i = 0; i < indEstaciones.length; i++) {
          var tempo = agrupaEstaciones[indEstaciones[i]];

          if(horas == 1){
            var promedio = tempo.length;
            indPromedios.push({'estacion':tempo[0].estacionesid,'promedio':tempo[promedio-1]});
          }
          else if(agrupaEstaciones[indEstaciones[i]].length > minPromedio){
            var suma = 0;
            for (var j = 0; j < tempo.length; j++) {
                suma += tempo[j].valororig;
            }
            var promedio = suma/tempo.length;
            indPromedios.push({'estacion':tempo[0].estacionesid,'promedio':promedio});
          }
        }

        //Ordenamos el arreglo para tomar los valores mas altos
        indPromedios.sort(function (a, b) {
          if (a.promedio < b.promedio) {
            return 1;
          }
          if (a.promedio > b.promedio) {
            return -1;
          }
          // a must be equal to b
          return 0;
        });

        for (var i = 0; i < 9; i++) {
          top15_estaciones[i] =  indPromedios[i];
        }

        var maxMaxLocal = 0;
        for (var i = 0; i < top15_estaciones.length; i++) {
          top15_estaciones[i].historico = get_historico_dias(parametro,horas,minPromedio,maxValor,top15_estaciones[i].estacion);
          for (var j = 0; j < top15_estaciones[i].historico.length; j++) {
            if(parseFloat(top15_estaciones[i].historico[j].promedio) > maxMaxLocal){
              maxMaxLocal = top15_estaciones[i].historico[j].promedio;
              console.log(top15_estaciones[i].historico[j].promedio);
              console.log(maxMaxLocal);
            }
          }
        }

        maxMAx = maxMaxLocal;
      },
      xhrFields: {
        withCredentials: false
      },
      crossDomain: true,
      async:false
    });

  activa(maxValor,maxMAx);
  }//fin del main

function get_historico_dias(parametro,horas,minPromedio,maxValor,estacionid){
  //datos de configuracion
  var horas = 24;
  var minPromedio = 12;
  var maxValor = 152;
  var agrupaFechas  = [];
  var indFecha     = [];
  var indPromediosHis      = [];

  const dActual = new Date();
  var dPasada = new Date();
  dPasada.setHours(restaHoras(dActual,24*28));

  var historico = [10, 23, 5, 99, 67, 43, 0,0, 23, 5, 99, 67, 43, 0,0, 23, 5, 99, 67, 43, 0,0, 23, 5, 99, 67, 43, 0];
  var url = "https://api.datos.gob.mx/v1/sinaica?parametro="+parametro+"&pageSize=12000&date-insert=[range:"+getFormatDateAPI(dPasada)+"%7C"+getFormatDateAPI(dActual)+"]&estacionesid="+estacionid;
  console.log(url);
  $.ajax({
    type: 'GET',
    url:url,
    data: {},
    success: function( data, textStatus, jqxhr ) {
      console.log('datos de 28 dias atras');
      console.log(data);
      //agrupamos por fechas
      for (var i = 0; i < data.results.length; i++) {

        if(!Array.isArray(agrupaFechas[data.results[i].fecha])){
          agrupaFechas[data.results[i].fecha] = [];
          indFecha.push(data.results[i].fecha);
        }

        //validacion desde el api para valores correctos
        if(data.results[i].validoorig == 1 && maxValor > data.results[i].valororig){
          agrupaFechas[data.results[i].fecha].push(data.results[i]);
        }
      }

      console.log('datos agrupados por fechas');
      console.log(agrupaFechas);

      //sacamos los promedios de cada fecha para que sean evaluadas
      for (var i = 0; i < indFecha.length; i++) {
        if(agrupaFechas[indFecha[i]].length > minPromedio){
          var tempo = agrupaFechas[indFecha[i]];

          var suma = 0;
          for (var j = 0; j < tempo.length; j++) {
              suma += tempo[j].valororig;
          }
          var promedio = suma/tempo.length;
          if(parametro ==  'PM10' || parametro == 'PM2.5')
            promedio = promedio.toFixed(1);
          else
            promedio = promedio.toFixed(3);
          indPromediosHis.push({'fecha':tempo[0].fecha,'promedio':promedio});
        }
      }

      console.log('indicador de promedios');
      console.log(indPromediosHis);
      historico = indPromediosHis;
    },
    xhrFields: {
      withCredentials: false
    },
    crossDomain: true,
    async:false
  });

  return historico;
}

function activa(valMax,maxMax){
  color = Chart.helpers.color;
  Chart.defaults.global.defaultFontColor = '#fff';
  Chart.defaults.global.defaultColor = 'rgba(255,255,255,1)';
  var container = document.querySelector('.cont');

  top15_estaciones.forEach(function(d) {
  console.log(d.estacion);
    var div = document.createElement('div');
    div.classList.add('chart-container');

    var canvas = document.createElement('canvas');
    div.appendChild(canvas);
    container.appendChild(div);

    //dividimos historico
    var labels = [];
    var datos = [];
    for (var i = 0; i < d.historico.length; i++) {
      labels.push(d.historico[i].fecha);
      datos.push(d.historico[i].promedio);
    }
    var ctx = canvas.getContext('2d');
    var config = createConfig(d.estacion,datos,labels,valMax,maxMax);
    new Chart(ctx, config);
  });
}

function createConfig(pointStyle,data,labels,valMax,maxMax) {
  var tam = labels.length;
  var aumento = 0;
  if(contaminante ==  'PM10' || contaminante == 'PM2.5')
    aumento = 5;
  else
    aumento = 1;

  return {
      type: 'line',
      data: {
          labels:labels,
          //["Ene", "Feb", "MAr", "Abr", "May", "Jun", "Jul","Ene", "Feb", "MAr", "Abr", "May", "Jun", "Jul","Ene", "Feb", "MAr", "Abr", "May", "Jun", "Jul","Ene", "Feb", "MAr", "Abr", "May", "Jun", "Jul"],
          datasets: [{
              label: "PM10",
              // backgroundColor: window.chartColors.red,
              backgroundColor: 'rgba(255,255,255,0.2)', //color(window.chartColors.gray).alpha(0.2).rgbString(),
              // borderColor: window.chartColors.red,
              borderColor: window.chartColors.gray,
              pointBackgroundColor: window.chartColors.gray,
              //window.chartColors.gray,
              data: data,
              // fill: false,
              //pointRadius: 1,
              //pointHoverRadius: 5,
              //showLine: false // no line shown
          }]
      },
      options: {
          responsive: true,
          title:{
              display:true,
              text:'Estacion: ' + pointStyle
          },
          legend: {
              display: false
          },
          scales: {
              xAxes: [{
                  gridLines: {
                      display: false,
                      drawBorder: false
                  },
                  display: true,
                  ticks: {
                      autoSkip: false,
                      maxRotation: 0,
                      minRotation: 0,
                      callback: function(dataLabel, index) {
                          // Hide the label of every 2nd dataset. return null to hide the grid line too
                          if(index == 0 || index == tam-1)
                            return get_fecha_formato(dataLabel);
                          else
                            return '';

                          //return index % 3 === 0 ? dataLabel : '';
                      }
                  }
              }],
              yAxes: [{
                  gridLines: {
                      display: true,
                      drawBorder: true
                  },
                  ticks: {
                      min: 0,
                      max: Math.round(maxMax),//costumisar max dependiendo del indicador que se vaya precentar
                      stepSize: Math.round((maxMax) / 3) // la divicion tiene que ser en 3
                  }
              }]
          }
          // elements: {
          //     point: {
          //         pointStyle: pointStyle
          //     }
          // }
      }
  };
}

//
//
// //datos de configuracion
// var horas = 24;
// var minPromedio = 12;
// var maxValor = 152;
// var maxMax = 0;
//
// const dActual = new Date();
// var dPasada = new Date();
// dPasada.setHours(restaHoras(dActual,horas));
//
//
// var url = "https://api.datos.gob.mx/v1/sinaica?parametro=PM10&pageSize=12000&date-insert=[range:"+getFormatDateAPI(dPasada)+"%7C"+getFormatDateAPI(dActual)+"] ";
//
// $.ajax({
//   type: 'GET',
//   url:url,
//   data: {},
//   success: function( data, textStatus, jqxhr ) {
//     console.log('datos ultimas 24 horas');
//     console.log(data);
//     var agrupaEstaciones  = [];
//     var indEstaciones     = [];
//     var indPromedios      = [];
//
//     //Agrupamos los registros por estacion
//     for (var i = 0; i < data.results.length; i++) {
//
//       if(!Array.isArray(agrupaEstaciones[data.results[i].estacionesid])){
//         agrupaEstaciones[data.results[i].estacionesid] = [];
//         indEstaciones.push(data.results[i].estacionesid);
//       }
//
//       //validacion desde el api para valores correctos
//       if(data.results[i].validoorig == 1 && maxValor > data.results[i].valororig){
//         agrupaEstaciones[data.results[i].estacionesid].push(data.results[i]);
//       }
//     }
//
//     console.log('Estaciones Agrupadas');
//     console.log(agrupaEstaciones);
//
//     console.log('indicador de estaciones agrupadas');
//     console.log(indEstaciones);
//
//     //sacamos los promedios de cada estacion para que sean evaluados
//     for (var i = 0; i < indEstaciones.length; i++) {
//       if(agrupaEstaciones[indEstaciones[i]].length > minPromedio){
//         var tempo = agrupaEstaciones[indEstaciones[i]];
//
//         var suma = 0;
//         for (var j = 0; j < tempo.length; j++) {
//             suma += tempo[j].valororig;
//         }
//         var promedio = suma/tempo.length;
//         indPromedios.push({'estacion':tempo[0].estacionesid,'promedio':promedio});
//       }
//     }
//
//     console.log('indicador de promedios');
//     console.log(indPromedios);
//
//     //Ordenamos el arreglo para tomar los valores mas altos
//     indPromedios.sort(function (a, b) {
//       if (a.promedio < b.promedio) {
//         return 1;
//       }
//       if (a.promedio > b.promedio) {
//         return -1;
//       }
//       // a must be equal to b
//       return 0;
//     });
//
//     console.log('indicador de promedios ordenado mayor a menor');
//     console.log(indPromedios);
//
//
//     for (var i = 0; i < 9; i++) {
//       top15_estaciones[i] =  indPromedios[i];
//     }
//
//     var maxMaxLocal = 0;
//     for (var i = 0; i < top15_estaciones.length; i++) {
//       top15_estaciones[i].historico = get_historico_dias('PM10','24','12',maxValor,top15_estaciones[i].estacion);
//       for (var j = 0; j < top15_estaciones[i].historico.length; j++) {
//         if(parseFloat(top15_estaciones[i].historico[j].promedio) > maxMaxLocal){
//           maxMaxLocal = top15_estaciones[i].historico[j].promedio;
//           console.log(top15_estaciones[i].historico[j].promedio);
//           console.log(maxMaxLocal);
//         }
//       }
//     }
//
//     console.log(maxMaxLocal);
//     maxMAx = maxMaxLocal;
//     console.log('estaciones con historico para graficar');
//     console.log(top15_estaciones);
//   },
//   xhrFields: {
//     withCredentials: false
//   },
//   crossDomain: true,
//   async:false
// });