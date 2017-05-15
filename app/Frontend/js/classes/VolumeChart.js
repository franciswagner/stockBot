/**
 * Created by Ian on 04/01/2017.
 */
var VolumeChart = function (candleList) {
    self = this;
    self.candleList = candleList;
    self.type = "ColumnChart";


    self.indicators = [];

    self.options = {
        crosshair: { trigger: 'both' },
        chartArea:{left:100,width:"100%"},
        legend: 'none',
        colors: ["blue"],
        interval: {}
    };
    self.baseOptions = angular.copy(self.options,self.baseOptions);

    self.data = {
        cols: [
            {type: "string"},
            {type: "number", role: "data"},
            {type: "string", role: "tooltip"}
        ],
        rows: []
    };
    self.baseData = angular.copy(self.data,self.baseData );

    self.addIndicator = function(name,_function, style, options) {

        /*
         options = {
         periods: number, //numero de periodos para o calculo do indicador
         color: string //cor do indicador no gráfico
         }
         */
        var indicatorName = name + "_" + self.indicators.length;
        //console.log(indicatorName);

        self.indicators.push({
            name: indicatorName,
            _function : _function,
            style: style,
            options : options
        });
        //console.log(self.indicators);

    };

    self.update = function() {

        //resetando as opções
        self.options = angular.copy(self.baseOptions,self.options);

        //resetando os dados
        self.data = angular.copy(self.baseData,self.data);

        var i;
        var interval_id;
        var dataSize;
        self.indicators.forEach(function(indicator,index) {

            self.indicators[index].data = indicator._function(candleList,indicator.options.periods);
            if(typeof self.indicators[index].data[0] === 'undefined')
                return;

            dataSize = self.indicators[index].data[0].length;

            for(i = 0; i < dataSize; i++) {
                interval_id = indicator.name + "_" + i;

                self.options.interval[interval_id] = {style: indicator.style, color: indicator.options.color};
                self.data.cols.push({
                    id: interval_id,
                    type: "number",
                    role: "interval"
                });
            }
        });

        var newRow;
        var tempData;
        self.candleList.forEach(function(candle,candleIndex){

            newRow = {c:[
                {v: ""},
                {v: candle.volume},
                {v: candle.start + "\nVolume: " + candle.volume + "\n" + candle.end},
            ]};

            self.indicators.forEach(function(indicator) {
                tempData = indicator.data[candleIndex];

                tempData.forEach(function(data){
                    newRow.c.push({v:data});
                });
            });

            self.data.rows.push(newRow);
        });

    };

};