/**
 * Created by Ian on 04/01/2017.
 */
var CandleChart = function (candleList) {
    self = this;
    self.candleList = candleList;
    self.type = "LineChart";

    self.getSelection = function() {
        console.log("vish");
    };

    self.indicators = [];

    self.options = {
        //width: 2500,
        vAxis: {
            //title: "Percentage Uptime",
            viewWindowMode:'maximized'
        },
        explorer: {},
        crosshair: {
            trigger: 'both',
            //orientation: ,
            opacity: 0.2
        },
        chartArea:{left:100,width:"100%"},
        legend: 'none',
        colors: ["green"],
        pointSize: 1,
        lineWidth: 0,
        interval: {
            'min' : {style: "sticks"},
            'max' : {style: "sticks"},
            'abe' : {style: "boxes"},
            'fec' : {style: "boxes"}
        }
    };
    self.baseOptions = angular.copy(self.options,self.baseOptions);

    self.data = {
        cols: [
            {type: "string"},
            {type: "number", role: "data"},
            {type: "string", role: "tooltip"},
            {type: "string", role: "style"},

            {id: "min",type: "number", role: "interval"},
            {id: "abe",type: "number", role: "interval"},
            {id: "fec",type: "number", role: "interval"},
            {id: "max",type: "number", role: "interval"}
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
                if(typeof indicator.options.pointSize !== 'undefined')
                    self.options.interval[interval_id].pointSize = indicator.options.pointSize;

                if(typeof indicator.options.opacity !== 'undefined')
                    self.options.interval[interval_id].opacity = indicator.options.opacity;

                self.options.interval[interval_id]
                self.data.cols.push({
                    id: interval_id,
                    type: "number",
                    role: "interval"
                });
            }
        });

        var  lastCandle = {
            close: 0
        };
        var newRow;
        var tempData;



        self.candleList.forEach(function(candle,candleIndex){
            var rtd = candle.exchange === "RTD" ? " RTD " : "";

            newRow = {c:[
                {v: ""},
                {v: (candle.open + candle.close)/2},
                {v: "#" + candleIndex + rtd + "\n" + candle.getDescription(lastCandle.close)},
                {v: candle.open >= candle.close ? "color: red" : "color: green"},

                {v: candle.min}, //min
                {v: candle.open}, //abertura
                {v: candle.close}, //fechamento
                {v: candle.max} //max
            ]};

            self.indicators.forEach(function(indicator) {
                tempData = indicator.data[candleIndex];

                tempData.forEach(function(data){
                    newRow.c.push({v:data});
                });
            });


            self.data.rows.push(newRow);
            lastCandle = candle;
        });

        //console.log(self.options,self.data);

    };
};