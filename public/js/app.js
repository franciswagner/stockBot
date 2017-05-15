/**
 * Created by Ian on 28/12/2016.
 */
angular.module("stockBotRoutes",[]).config(function($stateProvider){

    //$stateProvider.state('blank', {url: "/#",template: ""}); //rota nula que não redireciona.


    $stateProvider
        .state('candles', {
            url: "/candles",
            //template: '<h3>hello world!</h3>'
            templateUrl: "/view/candleChart",
            controller: 'candleController'
        })
    ;

});
/**
 * Created by Ian on 28/12/2016.
 */
angular.module("stockBot",[
    'ui.router',
    'ngMaterial',
    //'nvd3',
    'googlechart',
    //'ngAudio',
    //da app
    'stockBotRoutes'

]);
var app = angular.module("stockBot");

/**
 * Created by Ian on 02/01/2017.
 */



var Candle = function(start,end,min,open,close,max,volume,timestamp) {
    this.start = start;
    this.min = min;
    this.open = open;
    this.close = close;
    this.max = max;
    this.end = end;
    this.volume = volume;
    this.timestamp = timestamp;
};

Candle.prototype.getVariation = function() {

    var variation  = (Math.max(this.open,this.close) / Math.min(this.open,this.close))-1;
    if(this.open > this.close) { //baixa
        variation *=  -1;
    }
    variation *= 100;
    return Math.round(variation * 1000) / 1000;
    //return (variation * 100).toFixed(3);

};

Candle.prototype.getValorization = function(lastClosePrice) {

    var variation  = (Math.max(lastClosePrice,this.close) / Math.min(lastClosePrice,this.close))-1;
    if(this.open > this.close) { //baixa
        variation *=  -1;
    }
    variation *= 100;
    return Math.round(variation * 1000) / 1000;
    //return (variation * 100).toFixed(3);

};
Candle.prototype.getDescription = function(lastClosePrice) {
    return this.start+"\nAbe: "+this.open+"\nFec: "+this.close+"\nMax:"+this.max+"\nMin: "+this.min+"\nVol: " + this.volume+"\nVariação: "+ this.getVariation() +"%\nValorização: "+ this.getValorization(lastClosePrice) +"%\n"+this.end;
};

Candle.prototype.getBody = function() {
    return Math.abs(this.open - this.close);
};

Candle.prototype.getUpperShadow = function() {
    if(this.close >= this.open) { //candle de alta ou doji
        return this.max - this.close;
    }
    else {
        return this.max - this.open;
    }
};

Candle.prototype.getLowerShadow = function() {
    if(this.close >= this.open) { //candle de alta ou doji
        return this.open - this.min;
    }
    else {
        return this.close - this.min;
    }
};

Candle.prototype.isBullish = function() {
    return this.close >= this.open;
};

Candle.prototype.isBearish = function() {
    return this.close < this.open;
};



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
/**
 * Created by Ian on 04/01/2017.
 */
var LineChart = function (candleList,color) {
    self = this;
    self.candleList = candleList;
    self.type = "LineChart";

    self.indicators = [];

    self.options = {
        vAxis: {
            //title: "Percentage Uptime",
            viewWindowMode:'maximized'
        },
        //explorer: {},
        crosshair: { trigger: 'both' },
        'tooltip' : {
            trigger: 'hover'
        },
        chartArea:{left:100,width:"100%"},
        legend: 'none',
        colors: [color],
        pointSize: 2,
        interval: {
        }
    };
    self.baseOptions = angular.copy(self.options,self.baseOptions);

    self.data = {
        cols: [
            {type: "string"},
            {type: "number", role: "data"}
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
                {v: candle}
            ]};

            self.indicators.forEach(function(indicator) {
                tempData = indicator.data[candleIndex];

                tempData.forEach(function(data){
                    newRow.c.push({v:data});
                });
            });


            self.data.rows.push(newRow);
        });

        //console.log(self.options,self.data);

    };

};
var RenkoBrick = function(open,close,openTime,closeTime) {
    this.open = open;
    this.close = close;
    this.openTime = openTime;
    this.closeTime = closeTime;
};



/**
 * Created by Ian on 03/01/2017.
 */


var  Trench = function(value) {
    this.value = value;
    this.strength = 0; //confirmações.
};
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
/**
 * Created by Ian on 05/01/2017.
 */
app.service("candleAnalysisService",function(indicatorService) {
    var self = this;



    self.candlePatterns = {
        //bullish
        WHITE_MARUBOZU: {value: 0, name: "WHITE_MARUBOZU", type: 1},
        PIERCING_LINE: {value: 1, name: "PIERCING_LINE", type: 1},
        BULLISH_KICKING: {value: 2, name: "BULLISH_KICKING", type: 1},
        BULLISH_ABANDONED_BABY: {value: 3, name: "BULLISH_ABANDONED_BABY", type: 1},
        MORNING_STAR : {value: 4, name: "MORNING_STAR", type: 1},
        BULLISH_ENGULFING: {value: 5, name: "BULLISH_ENGULFING", type: 1},
        THREE_OUTSIDE_UP : {value: 6, name: "THREE_OUTSIDE_UP", type: 1},
        BULLISH_DRAGONFLY_DOJI : {value: 7, name: "BULLISH_DRAGONFLY_DOJI", type: 1},
        BULLISH_GRAVESTONE: {value: 8, name: "BULLISH_GRAVESTONE", type: 1},
        BULLISH_HARAMI: {value: 9, name: "BULLISH_HARAMI", type: 1},
        BULLISH_HARAMI_CROSS: {value: 10, name: "BULLISH_HARAMI_CROSS", type: 1},
        BREAKWAY: {value: 11, name: "BREAKWAY", type: 1},
        HAMMER: {value: 12, name: "HAMMER", type: 1}, //TODO: melhorar a formula
        SHOOTING_STAR : {value: 13, name: "SHOOTING_STAR", type: 1},

        //neutral
        DOJI: {value: 100, name: "DOJI", type: 0},
        LONG_LEGGED_DOJI : {value: 101, name: "LONG_LEGGED_DOJI", type: 0},

        //bearish
        BLACK_MARUBOZU: {value: 200, name: "BLACK_MARUBOZU", type: -1},
        BEARISH_ABANDONED_BABY: {value: 201, name: "BEARISH_ABANDONED_BABY", type: -1},
        BEARISH_DRAGONFLY_DOJI : {value: 202, name: "BEARISH_DRAGONFLY_DOJI", type: -1},
        BEARISH_ENGULFING: {value: 203, name: "BEARISH_ENGULFING", type: -1},
        DARK_CLOUD: {value: 204, name: "DARK_CLOUD", type: -1}, //TODO não detectou nenhum ainda pela formula nova.
        EVENING_STAR : {value: 205, name: "EVENING_STAR", type: -1},
        THREE_BLACK_CROWS : {value: 206, name: "THREE_BLACK_CROWS", type: -1},
        BEARISH_GRAVESTONE: {value: 207, name: "BEARISH_GRAVESTONE", type: -1},
        BEARISH_HARAMI: {value: 208, name: "BEARISH_HARAMI", type: -1},
        BEARISH_HARAMI_CROSS: {value: 209, name: "BEARISH_HARAMI_CROSS", type: -1},
        BEARISH_KICKING: {value: 210, name: "BEARISH_KICKING", type: -1},
        HANGING_MAN: {value: 211, name: "HANGING_MAN", type: -1},  //TODO: melhorar a formula
        INVERTED_HAMMER: {value: 12, name: "INVERTED_HAMMER", type: -1},

        //auxiliar em teste
        LONG_BODY: {value: 400, name: "LONG_BODY"},
        LONG_LEGS: {value: 401, name: "LONG_LEGS"},
        SHORT_BODY: {value: 402, name: "SHORT_BODY"},
        LONG_SHADOW_LOWER : {value: 403, name: "LONG_SHADOW_LOWER"},
        LONG_SHADOW_UPPER : {value: 404, name: "LONG_SHADOW_UPPER"}

        //auxiliares
        //valor >= 500 indica q é auxiliar, e não deve ser detectado em detectAll;



    };


    //TODO: DIFERENCIAR TENDENCIA DE MOVIMENTOS.
    //Parece que nos exemplos de padrões, os traços anteriores/posteriores são movimentos, e não tendências.

    self.detect = function(pattern,candleList) {

        if(candleList.length === 0) //n tem candle pra detectar
            return false;


        //padrão não definido.
        if(typeof self.candlePatterns[pattern.name] === 'undefined') {
            console.log("padrão inválido");
            return false;
        }

        var _function = "detect_" + pattern.name;
        //função de detecção não implementada
        if(typeof self[_function] === 'undefined') {
            console.log("função de detecção não implementada");
            return false;
        }

        return self[_function](candleList);
    };
    self.detectAll = function(candleList) {

        var patternList = [];
        var results = []

        //convertendo para array a lista de padrões;
        for (var key in self.candlePatterns)
            patternList.push(self.candlePatterns[key]);

        patternList.forEach(function(pattern){
            //valor >= 500 indica q é auxiliar, e não deve ser detectado em detectAll;
            if(pattern.value >= 500)
                return;

            if(candleList.length === 0) { //n tem candle pra detectar
                results.push([pattern.value,pattern.name,false]);
                return;
            }

            var _function = "detect_" + pattern.name;
            //função de detecção não implementada
            if(typeof self[_function] === 'undefined') {
                results.push([pattern.value,pattern.name,false]);
                return;
            }

            results.push([pattern.value,pattern.name,self[_function](candleList)]);
        });


        return results;

    };

    //detectores bullish
    self.detect_WHITE_MARUBOZU = function(candleList) {

        var candle = candleList[candleList.length -1];

        if(!candle.isBullish()) //não é de alta.
            return false;

        //corpo longo
        if(self.detect_LONG_BODY(candleList))
            return false; //corpo curto


        //soma das sombras = 0
        if((candle.getUpperShadow() + candle.getLowerShadow()) > 0)
            return false; //soma das sombras maior que 0

        return true;
    };
    self.detect_PIERCING_LINE = function(candleList) {

        var size = candleList.length;

        if(size < 2) //tamanho insuficiente pra detectar.
            return false;



        //formula de teste

        candle1 = candleList[size-2];
        candle = candleList[size-1];

        return  (candle1.close < candle1.open) &&
                (((candle1.open + candle1.close) / 2) < candle.close) &&
                (candle.open < candle.close) && (candle.open < candle1.close) &&
                (candle.close < candle1.open) &&
                ((candle.close - candle.open) / (0.001 + (candle.max - candle.min)) > 0.6)
        ;



        //tendencia atual: baixa
        var tendency = indicatorService.getActualTendency(candleList);
        //console.log(tendency.type !== indicatorService.tendencyType.BEARISH,":",tendency);
        if(tendency.type !== indicatorService.tendencyType.BEARISH)
            return false; //tendencia não é de baixa.

        //candle anterior: baixa
        if(!candleList[size-2].isBearish())
            return false; //candle anterior não é de baixa.

        //candle atual: alta
        if(!candleList[size-1].isBullish())
            return false; //candle atual não é de alta.

        //candle atual tem corpo longo.
        if(!self.detect_LONG_BODY([candleList[size-1]]))
            return false; //candle atual não tem corpo longo.



        //caracteristica do atual: fechamento superior a metade do corpo do anterior.
        var middle = candleList[size-2].open - (candleList[size-2].getBody()/2);
        return candleList[size-1].close > middle;

    };
    self.detect_BULLISH_KICKING = function(candleList) {
        var size = candleList.length;

        if(size < 2) //tamanho insuficiente pra detectar.
            return false;


        //formula de teste
        candle1 = candleList[size-2];
        candle = candleList[size-1];

        return  (candle1.open > candle1.close) && 
                (candle.open >= candle1.open) && 
                (candle.close > candle.open)
        ;


        var list = [];

        list.push(candleList[size-2]);
        var black_marubozu = self.detect_BLACK_MARUBOZU(list);
        if(!black_marubozu) //esse n é o penultimo.
            return false;

        list.push(candleList[size-1]);
        var white_marubozu = self.detect_WHITE_MARUBOZU(list);
        if(!white_marubozu) //esse n é o ultimo
            return false;

        //houve formação de gap entre os dois?
        return list[0].open < list[1].open;
    };
    self.detect_DOJI = function(candleList){



        var dojiDetectionFactor = 0.02;//porcentagem de variação do corpo máxima para detecção
        candle = candleList[candleList.length-1];

        //formula de teste
        return (Math.abs(candle.open - candle.close) <= ((candle.max - candle.min ) * 0.1));




        //variação entre abertura e fechamento;
        var variation  = (Math.max(candle.open,candle.close) / Math.min(candle.open,candle.close))-1;
        variation *= 100;

        //variação menor ou igual  a permitida.
        return variation <= dojiDetectionFactor
    };
    self.detect_LONG_LEGGED_DOJI = function(candleList){


        return self.detect_DOJI(candleList) && self.detect_LONG_LEGS(candleList);

    };
    self.detect_BULLISH_ABANDONED_BABY = function(candleList) {

        var size = candleList.length;

        if(size < 3) //tamanho insuficiente pra detectar.
            return false;

        //tendencia atual: baixa
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BEARISH)
            return false; //tendencia não é de baixa.

        //primeiro: baixa e não doji.
        if(!candleList[size-3].isBearish() || self.detect_DOJI([candleList[size-3]]))
            return false; //não é de baixa ou é doji


        //segundo: doji
        if(!self.detect_DOJI([candleList[size-2]]))
            return false; //não é doji

        //terceiro: alta e não doji.
        if(!candleList[size-1].isBullish() || self.detect_DOJI([candleList[size-1]]))
            return false; //não é de alta ou é doji

        //gap entre a máxima do doji e minima dos candles em volta.
        return candleList[size-2].max < candleList[size-3].min && candleList[size-2].max < candleList[size-1].min;

    };
    self.detect_MORNING_STAR = function(candleList) {


        //TODO: os candles de corpo pequeno entre os dois maiores podem ser mais de um.
        var size = candleList.length;

        if(size < 3) //tamanho insuficiente pra detectar.
            return false;

        //formula de teste
        candle2 = candleList[size-3];
        candle1 = candleList[size-2];
        candle = candleList[size-1];


        return  (candle2.open>candle2.close)&&
                ((candle2.open-candle2.close)/(0.001+candle2.max-candle2.min)>0.6)&&
                (candle2.close>candle1.open)&&
                (candle1.open>candle1.close)&&
                ((candle1.max-candle1.min)>(3*(candle1.close-candle1.open)))&&
                (candle.close>candle.open)&&
                (candle.open>candle1.open)
        ;




        //tendencia atual: baixa
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BEARISH)
            return false; //tendencia não é de baixa.

        //primeiro: baixa e não doji.
        if(!candleList[size-3].isBearish() || self.detect_DOJI([candleList[size-3]]))
            return false; //não é de baixa ou é doji


        //segundo: corpo curto ou doji
        if(!self.detect_SHORT_BODY([candleList[size-2]]))
            return false; //corpo não é curto


        //terceiro: alta e não doji.
        if(!candleList[size-1].isBullish() || self.detect_DOJI([candleList[size-1]]))
            return false; //não é de alta ou é doji

        return true;
    };
    self.detect_SHOOTING_STAR = function(candleList) {

        candle = candleList[candleList.length-1];

        return  ((candle.max - candle.min) > 4 * (candle.open - candle.close)) &&
                ((candle.max - candle.close) / (0.001 + candle.max - candle.min) >= 0.75) &&
                ((candle.max - candle.open) / (0.001 + candle.max - candle.min) >= 0.75)
        ;




    };
    self.detect_BULLISH_ENGULFING = function(candleList) {
        var size = candleList.length;

        if(size < 2) //tamanho insuficiente pra detectar.
            return false;




        //formula de teste

        candle1 = candleList[size-2];
        candle = candleList[size-1];

        return  (candle1.open > candle1.close) &&
                (candle.close > candle.open) &&
                (candle.close >= candle1.open) &&
                (candle1.close >= candle.open) &&
                ((candle.close - candle.open) > (candle1.open - candle1.close))
        ;





        //tendencia atual: baixa
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BEARISH)
            return false; //tendencia não é de baixa.

        //primeiro: baixa (calibrar pra ver se pode ou não ser doji).
        if(!candleList[size-2].isBearish() || self.detect_DOJI([candleList[size-2]]))
            return false; //não é de baixa ou é doji

        //segundo: alta (calibrar pra ver se corpo longo ou não)
        if(!candleList[size-1].isBullish() || !self.detect_LONG_BODY([candleList[size-1]]))
            return false; //não é de alta ou não tem corpo longo

        //corpo do segundo encobre o corpo do primeiro (não tem necessidade de encobrir as sombras)
        return candleList[size-1].close > candleList[size-2].open &&  candleList[size-1].open < candleList[size-2].close;

    };
    self.detect_THREE_OUTSIDE_UP = function(candleList) {
        var size = candleList.length;

        if(size < 3) //tamanho insuficiente pra detectar.
            return false;

        //engolfo de alta
        if(!self.detect_BULLISH_ENGULFING([candleList[size-3],candleList[size-2]]))
            return false; //não contem engolfo de alta anterior.

        //confirmação de alta (calibrar pra ver se precisa de corpo longo)
        if(!candleList[size-1].isBullish() || !self.detect_LONG_BODY([candleList[size-1]]))
            return false; //não é de alta ou não tem corpo longo

        return true;
    };
    self.detect_BULLISH_DRAGONFLY_DOJI = function(candleList){
        var candle = candleList[candleList.length-1];

        //tendencia atual: baixa
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BEARISH)
            return false; //tendencia não é de baixa.

       //é doji
        if(!self.detect_DOJI([candle]))
            return false; //não é doji.

        //sombra superior bem curta. 10% da inferior ou menos
        if(candle.getUpperShadow() > (candle.getLowerShadow() * 0.1))
            return false; //não é curta a sombra superior.

        //longa sombra inferior. variação de 0.1% no preço. de abertura/fechamento/maximo
        return candle.min <= (candle.close * 0.999);

    };
    self.detect_BULLISH_GRAVESTONE = function(candleList){
        var size = candleList.length;

        if(size < 2) //tamanho insuficiente pra detectar.
            return false;

        //tendencia atual: baixa
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BEARISH)
            return false; //tendencia não é de baixa.

        //primeiro: baixa e não doji.
        if(!candleList[size-2].isBearish() || self.detect_DOJI([candleList[size-2]]))
            return false; //não é de baixa ou é doji

        //segundo: doji q encerra na minima.
        if(!self.detect_DOJI([candleList[size-1]]) || candleList[size-2].close !== candleList[size-1].min)
            return false; //não é doji ou não encerrou na minima

        return true;
    };
    self.detect_BULLISH_HARAMI = function(candleList){
        var size = candleList.length;

        if(size < 2) //tamanho insuficiente pra detectar.
            return false;

        candle1 = candleList[size-2];
        candle = candleList[size-1];

        return  (candle1.open > candle1.close) &&
                (candle.close > candle.open) &&
                (candle.close <= candle1.open) &&
                (candle1.close <= candle.open) &&
                ((candle.close - candle.open) < (candle1.open - candle1.close))
            ;
    };
    self.detect_BULLISH_HARAMI_CROSS = function(candleList){
        var size = candleList.length;

        if(size < 2) //tamanho insuficiente pra detectar.
            return false;

        //tendencia atual: baixa
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BEARISH)
            return false; //tendencia não é de baixa.


        //primeiro: candle força baixa. (calibrar pra ver se eh marubozu ou soh longo msm)
        if(!self.detect_LONG_BODY([candleList[size-2]]) || !candleList[size-2].isBearish())
            return false; //não é longo ou de baixa.

        //segundo: doji.
        if(!self.detect_DOJI([candleList[size-2]]))
            return false; //não é doji

        return true;
    };
    self.detect_BREAKWAY = function(candleList){


        //TODO: complexo. procurar por mais fontes de definição do padrão.
        return false;

        var size = candleList.length;

        if(size < 5) //tamanho insuficiente pra detectar.
            return false;

        //tendencia atual: baixa
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BEARISH)
            return false; //tendencia não é de baixa.

        //TODO: CONTINUAR DETECÇÃO
        //primeiro: baixa forte, longo
        //segundo: baixa

        //quinto: alta


        return true;
    };
    self.detect_HAMMER = function(candleList){
        candle = candleList[candleList.length-1];

        return  ((candle.max-candle.min)>3*(candle.open-candle.close)&&
                ((candle.close-candle.min)/(0.001+candle.max-candle.min)>0.6)&&
                ((candle.open-candle.min)/(0.001+candle.max-candle.min)>0.6))
        ;
    };

    //detectores bearish
    self.detect_DARK_CLOUD = function(candleList) {

        var size = candleList.length;

        if(size < 2) //tamanho insuficiente pra detectar.
            return false;

        candle1 = candleList[size-2];
        candle = candleList[size-1];

        return  (candle1.close > candle1.open) &&
                (((candle.close1 + candle1.open) / 2) > candle.close) &&
                (candle.open > candle.close) && (candle.open > candle.close1) &&
                (candle.close > candle1.open) &&
                ((candle.open - candle.close) / (0.001 + (candle.max - candle.min)) > 0.6)
        ;


        //tendencia atual: alta
        var tendency = indicatorService.getActualTendency(candleList);
        //console.log(tendency.type !== indicatorService.tendencyType.BEARISH,":",tendency);
        if(tendency.type !== indicatorService.tendencyType.BULLISH)
            return false; //tendencia não é de alta.

        //candle anterior: alta
        if(!candleList[size-2].isBullish())
            return false; //candle anterior não é de alta.

        //candle atual: baixa
        if(!candleList[size-1].isBearish())
            return false; //candle atual não é de baixa.

        //candle atual tem corpo longo.
        if(!self.detect_LONG_BODY([candleList[size-1]]))
            return false; //candle atual não tem corpo longo.


        //candle atual tem abertura maior que máxima do candle anterior.
        if(candleList[size-1].open < candleList[size-2].max)
            return false;// abertura não é maior que máxima do anterior.



        //caracteristica do atual: fechamento inferior a metade do corpo do anterior.
        var middle = candleList[size-2].open + (candleList[size-2].getBody()/2);
        return candleList[size-1].close < middle;

    };
    self.detect_BEARISH_ABANDONED_BABY = function(candleList) {
        var size = candleList.length;

        if(size < 3) //tamanho insuficiente pra detectar.
            return false;

        //tendencia atual: alta
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BULLISH)
            return false; //tendencia não é de alta.

        //primeiro: alta e não doji
        if(!candleList[size-3].isBullish()|| self.detect_DOJI([candleList[size-3]]))
            return false; //não é de alta ou é doji

        //segundo: doji
        if(!self.detect_DOJI([candleList[size-2]]))
            return false; //não é doji

        //terceiro: baixa e não doji
        if(!candleList[size-1].isBearish()|| self.detect_DOJI([candleList[size-1]]))
            return false; //não é de baixa ou é doji

        //gap entre a minima do doji e máxima dos candles em volta.
        return candleList[size-2].min > candleList[size-3].max && candleList[size-2].min > candleList[size-1].max;

    };
    self.detect_BLACK_MARUBOZU = function(candleList) {

        var candle = candleList[candleList.length -1];

        if(!candle.isBearish()) //não é de baixa.
            return false;

        //corpo longo
        if(self.detect_LONG_BODY(candleList))
            return false; //corpo curto

        //soma das sombras = 0
        if((candle.getUpperShadow() + candle.getLowerShadow()) > 0)
            return false; //soma das sombras maior que 0

        return true;
    };
    self.detect_EVENING_STAR = function(candleList) {


        //TODO: os candles de corpo pequeno entre os dois maiores podem ser mais de um.
        var size = candleList.length;

        if(size < 3) //tamanho insuficiente pra detectar.
            return false;



        //formula de teste
        candle2 = candleList[size-3];
        candle1 = candleList[size-2];
        candle = candleList[size-1];


        return  (candle2.close > candle2.open) &&
                ((candle2.close - candle2.open) / (0.001 + candle2.max - candle2.min) > 0.6) &&
                (candle2.close < candle1.open) && (candle1.close > candle1.open) &&
                ((candle1.max - candle1.min) > (3 * (candle1.close - candle1.open))) &&
                (candle.open > candle.close) && (candle.open < candle1.open)
        ;



        //tendencia atual: alta
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BULLISH)
            return false; //tendencia não é de alta.

        //primeiro: alta e não doji.
        if(!candleList[size-3].isBullish() || self.detect_DOJI([candleList[size-3]]))
            return false; //não é de alta ou é doji


        //segundo: corpo curto ou doji
        if(!self.detect_SHORT_BODY([candleList[size-2]]))
            return false; //corpo não é curto

        //terceiro: baixa e não doji.
        if(!candleList[size-1].isBearish() || self.detect_DOJI([candleList[size-1]]))
            return false; //não é de baixa ou é doji

        return true;
    };
    self.detect_THREE_BLACK_CROWS = function(candleList) {



        var size = candleList.length;

        if(size < 3) //tamanho insuficiente pra detectar.
            return false;

        //tendencia atual: alta
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BULLISH)
            return false; //tendencia não é de alta.

        for(var i = 1; i <= 3; i++) {
            //todos lognos e de baixa.
            if (!candleList[size-i].isBearish() || self.detect_LONG_BODY([candleList[size-i]]))
                return false;
        }


        return true;
    };
    self.detect_BEARISH_DRAGONFLY_DOJI = function(candleList){
        var candle = candleList[candleList.length-1];

        //tendencia atual: alta
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BULLISH)
            return false; //tendencia não é de alta.

        //é doji
        if(!self.detect_DOJI([candle]))
            return false; //não é doji.

        //sombra superior bem curta. 10% da inferior ou menos
        if(candle.getUpperShadow() > (candle.getLowerShadow() * 0.1))
            return false; //não é curta a sombra superior.

        //longa sombra inferior. variação de 0.1% no preço. de abertura/fechamento/maximo
        return candle.min <= (candle.close * 0.999);

    };
    self.detect_BEARISH_ENGULFING = function(candleList) {
        var size = candleList.length;

        if(size < 2) //tamanho insuficiente pra detectar.
            return false;


        //formula de teste.
        candle1 = candleList[size-2];
        candle = candleList[size-1];

        return  (candle1.close > candle1.open) &&
                (candle.open > candle.close) &&
                (candle.open >= candle1.close) &&
                (candle1.open >= candle.close) &&
                ((candle.open - candle.close) > (candle1.close - candle1.open))
        ;





        //tendencia atual: alta
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BULLISH)
            return false; //tendencia não é de alta.

        //primeiro: alta (calibrar pra ver se pode ou não ser doji).
        if(!candleList[size-2].isBullish() || self.detect_DOJI([candleList[size-2]]))
            return false; //não é de alta ou é doji

        //segundo: baixa(calibrar pra ver se corpo longo ou não)
        if(!candleList[size-1].isBearish() || !self.detect_LONG_BODY([candleList[size-1]]))
            return false; //não é de baixa ou não tem corpo longo

        //corpo do segundo encobre o corpo do primeiro (não tem necessidade de encobrir as sombras)
        return candleList[size-1].close < candleList[size-2].open &&  candleList[size-1].open > candleList[size-2].close;

    };
    self.detect_BEARISH_GRAVESTONE = function(candleList){
        var size = candleList.length;

        if(size < 2) //tamanho insuficiente pra detectar.
            return false;

        //tendencia atual: alta
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BULLISH)
            return false; //tendencia não é de alta.

        //primeiro: alta e não doji.
        if(!candleList[size-2].isBullish() || self.detect_DOJI([candleList[size-2]]))
            return false; //não é de alta ou é doji

        //segundo: doji q encerra na minima.
        if(!self.detect_DOJI([candleList[size-1]]) || candleList[size-2].close !== candleList[size-1].min)
            return false; //não é doji ou não encerrou na minima

        return true;
    };
    self.detect_BEARISH_HARAMI = function(candleList){
        var size = candleList.length;

        if(size < 2) //tamanho insuficiente pra detectar.
            return false;

        candle1 = candleList[size-2];
        candle = candleList[size-1];


        return  (candle1.close > candle1.open) &&
                (candle.open > candle.close) &&
                (candle.open <= candle1.close) &&
                (candle1.open <= candle.close) &&
                ((candle.open - candle.close) < (candle1.close - candle1.open))
            ;
    };
    self.detect_BEARISH_HARAMI_CROSS = function(candleList){
        var size = candleList.length;

        if(size < 2) //tamanho insuficiente pra detectar.
            return false;

        //tendencia atual: alta
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type !== indicatorService.tendencyType.BULLISH)
            return false; //tendencia não é de alta.


        //primeiro: candle força de alta. (calibrar pra ver se eh marubozu ou soh longo msm)
        if(!self.detect_LONG_BODY([candleList[size-2]]) || !candleList[size-2].isBullish())
            return false; //não é longo ou de alta.

        //segundo: doji.
        if(!self.detect_DOJI([candleList[size-2]]))
            return false; //não é doji

        return true;
    };
    self.detect_BEARISH_KICKING = function(candleList) {
        var size = candleList.length;

        if(size < 2) //tamanho insuficiente pra detectar.
            return false;


        //formula de teste
        candle1 = candleList[size-2];
        candle = candleList[size-1];

        return  (candle1.open < candle1.close) &&
            (candle.open <= candle1.open) &&
            (candle.close <= candle.open)
            ;
    };
    self.detect_HANGING_MAN = function(candleList){
        candle = candleList[candleList.length-1];

        return  (((candle.max - candle.min) > 4 * (candle.open - candle.close)) &&
                ((candle.close - candle.min) / (0.001 + candle.max - candle.min) >= 0.75) &&
                ((candle.open - candle.min) / (0.001 + candle.max - candle.min) >= 0.075))
        ;

    };
    self.detect_INVERTED_HAMMER = function(candleList){
        candle = candleList[candleList.length-1];

        return  ((candle.max - candle.min) > 3 * (candle.open - candle.close)) &&
                ((candle.max - candle.close) / (0.001 + candle.max - candle.min) > 0.6) &&
                ((candle.max - candle.open) / (0.001 + candle.max - candle.min) > 0.6)
        ;


    };





    //detectores auxiliares
    self.detect_LONG_BODY = function(candleList) {

        var mmeLife = 8;
        var detectionFactor = 1.5;

        if(candleList.size < mmeLife ) {
            return false; //insuficiente pra calcular a média do corpo.
        }

        //o tamanho da parte é 1.5x maior que a MMEB5.


        var mme = indicatorService.MMEB(candleList, mmeLife ).pop().pop();

        if(mme === null)
            return false;

        var candle = candleList[candleList.length - 1];

        //console.log(candle.getBody(),mme,candle.getBody()/mme);
        return (candle.getBody() / mme) > detectionFactor;




        //o corpo é maior do que a soma das sombras.
        var candle = candleList[candleList.length - 1];

        return candle.getBody() > (candle.getUpperShadow() + candle.getLowerShadow());

        //testar depois com o resto.

        if (candle.getBody() < (candle.getUpperShadow() + candle.getLowerShadow())) {
            return false; //corpo menor que soma das sombras.
        }

        return candle.getBody() > indicatorService.MMEB(candleList,4)[candleList.length-1][0];

    };
    self.detect_SHORT_BODY = function(candleList) {




        var mmeLife = 8;
        var detectionFactor = 1.5;

        if(candleList.size < mmeLife ) {
            return false; //insuficiente pra calcular a média do corpo.
        }

        //o tamanho da parte é 1.5x maior que a MMEB5.


        var mme = indicatorService.MMEB(candleList, mmeLife ).pop().pop();

        if(mme === null)
            return false;

        var candle = candleList[candleList.length - 1];

        if(candle.getBody() == 0 )
            return true;


        return ( mme / candle.getBody()) > detectionFactor;






        var candle = candleList[candleList.length-1];

        //a variação do corpo é de no máximo 0.07%
        return Math.abs( (Math.max(candle.open,candle.close) / Math.min(candle.open,candle.close))-1) < 0.0007;

    };
    self.detect_LONG_LEGS = function(candleList) {
        return self.detect_LONG_SHADOW_LOWER(candleList) && self.detect_LONG_SHADOW_UPPER(candleList);
    };
    self.detect_LONG_SHADOW_LOWER = function(candleList) {

        var mmeLife = 8;
        var detectionFactor = 1.5;

        if(candleList.size < mmeLife ) {
            return false; //insuficiente pra calcular a média do corpo.
        }

        //o tamanho da parte é 1.5x maior que a MMEB5.


        var mme = indicatorService.MMELS(candleList, mmeLife ).pop().pop();

        if(mme === null)
            return false;

        var candle = candleList[candleList.length - 1];

        //console.log(candle.getLowerShadow(),mme,candle.getLowerShadow()/mme);
        return (candle.getLowerShadow() / mme) > detectionFactor;
    };
    self.detect_LONG_SHADOW_UPPER = function(candleList) {

        var mmeLife = 8;
        var detectionFactor = 1.5;

        if(candleList.size < mmeLife ) {
            return false; //insuficiente pra calcular a média do corpo.
        }

        //o tamanho da parte é 1.5x maior que a MME(mmeLife).


        var mme = indicatorService.MMEUS(candleList, mmeLife ).pop().pop();

        if(mme === null)
            return false;

        var candle = candleList[candleList.length - 1];

        //console.log(candle.getLowerShadow(),mme,candle.getLowerShadow()/mme);
        return (candle.getUpperShadow() / mme) > detectionFactor;
    };
    self.detect_SHORT_SHADOW_LOWER = function(candleList) {


        var candle = candleList[candleList.length - 1];
        if(candle.getLowerShadow() == 0 )
            return true;

        var mmeLife = 8;
        var detectionFactor = 1.5;

        if(candleList.size < mmeLife ) {
            return false; //insuficiente pra calcular a média do corpo.
        }

        //o tamanho da parte é 1.5x maior que a MME(mmeLife).
        var mme = indicatorService.MMEUS(candleList, mmeLife ).pop().pop();

        if(mme === null)
            return false;

        //console.log(candle.getLowerShadow(),mme,candle.getLowerShadow()/mme);
        return ( mme / candle.getLowerShadow()) > detectionFactor;
    };
    self.detect_SHORT_SHADOW_UPPER = function(candleList) {

        var candle = candleList[candleList.length - 1];
        if(candle.getUpperShadow() == 0 )
            return true;

        var mmeLife = 8;
        var detectionFactor = 1.5;

        if(candleList.size < mmeLife ) {
            return false; //insuficiente pra calcular a média do corpo.
        }

        //o tamanho da parte é 1.5x maior que a MME(mmeLife).
        var mme = indicatorService.MMEUS(candleList, mmeLife ).pop().pop();

        if(mme === null)
            return false;

        //console.log(candle.getLowerShadow(),mme,candle.getLowerShadow()/mme);
        return ( mme / candle.getUpperShadow()) > detectionFactor;
    };

});
/**
 * Created by Ian on 02/01/2017.
 */

app.service("indicatorService",function() {
    var self = this;

    self.tops = [];
    self.bottoms = [];
    self.trenchs = [];
    self.tendencies = [];
    self.trenchVariability = 0.02; //centavos
    self.trenchLifeTime = 190; //trincheiras cujo indice seja menor do que o tamanho da lista - esse valor não serão consideradas.
    self.trenchConfirmations = 2;
    self.topBottomConfirmations = 1;
    self.tendencyType  = {
        UNDEFINED: 999,
        BULLISH: 1,
        NEUTRAL: 0,
        BEARISH: -1,
    };



    self.findTrenchs = function(candleList) {

        //inicialmente, todos os topos/fundos (dentro da margem de erro) são trincheira.
        //a cada toque de um topo ou fundo em uma trincheira, sua força aumenta.
        // mas se a trincheira for desrespeitada, sua força é zerada.
        //ao final do processo, apenas trincheiras com força self.trenchConfirmations serão consideradas válidas.


        //provável reversão de tendência = trincheira.
        self.trenchs = [];
        self.findTopsBottoms(candleList);

        var first = self.tops;
        var second =  self.bottoms;
        //var firstType = self.tendencyType.BEARISH;
       // var secondType = self.tendencyType.BULLISH;

        if(first.length > 0 && second.lengh > 0) {
            if(first[0].index > second[0].index) {
                second = self.tops;
                first =  self.bottoms;
               // secondType = self.tendencyType.BEARISH;
                //firstType = self.tendencyType.BULLISH;
            }
        }

        first.forEach(function(element){

            trenchIndex = self.trenchs.findIndex(function(trench){

                return element.value >= trench.value - self.trenchVariability && element.value <= trench.value + self.trenchVariability;
            });
            // console.log(trenchIndex);
            if(trenchIndex === -1) {
                self.trenchs.push({value : element.value, strength: 0, index: element.index});
            }

        });

        second.forEach(function(element){

            trenchIndex = self.trenchs.findIndex(function(trench){
                return element.value >= trench.value - self.trenchVariability && element.value <= trench.value + self.trenchVariability;
            });
            //console.log(trenchIndex);
            if(trenchIndex === -1) {
                self.trenchs.push({value : element.value, strength: 0, index: element.index});
            }
        });



        //resistencia, suporte

        self.trenchs = self.trenchs.sort(function(a,b){
           return a.value - b.value;
        });

        //console.log(self.trenchs);







        //dividir a candlelist em chunks e processar cada chunk assincronamente.
/*
        var buffer  = [];
        candleList.forEach(function(candle,index){

            candle.index = index;
            buffer.push(candle);
            if(buffer.length === 50 || index+1 === candleList.length) {
                //processar e esvaziar buffer.
                (new Promise(function (fulfill) {
                    buffer.forEach(function(candle){
                        var i = candle.index;
                        if(i < 1)
                            return;

                        //apenas as trincheiras descobertas no momento.
                        var currentTrenchs =  self.trenchs.filter(function(trench){
                            return trench.index < i;
                        });


                        if(currentTrenchs.length < 0)
                            return;


                        //achar a resistência e o suporte do candle anterior.
                        var lastCandle = candleList[i-1];

                        currentTrenchs.push({value:lastCandle.close,candle : true});

                        currentTrenchs = currentTrenchs.sort(function(a,b){
                            return a.value - b.value;
                        });

                        var position = currentTrenchs.findIndex(function(trench){
                            return typeof trench.candle !== 'undefined';
                        });

                        var supportIndex = position-1;
                        var resistanceIndex = position;

                        currentTrenchs = currentTrenchs.filter(function(trench){
                            return typeof trench.candle === 'undefined';
                        });

                        supportIndex = typeof currentTrenchs[supportIndex] === 'undefined' ? -1 : supportIndex;
                        resistanceIndex = typeof currentTrenchs[resistanceIndex] === 'undefined' ? -1 : resistanceIndex;


                        if(supportIndex === -1 && resistanceIndex === -1)
                            return;



                        if(supportIndex !== -1) { //existe suporte.
                            var trenchIndex = supportIndex;
                            var trench = currentTrenchs[trenchIndex];
                            if(candle.close > trench.value + self.trenchVariability) {
                                //console.log("houve rompimento.+");
                                //self.trenchs[trenchIndex].strength--;
                            }
                            else if(lastCandle.close >= trench.value - self.trenchVariability &&
                                lastCandle.close <= trench.value + self.trenchVariability &&
                                candle.close <= trench.value + self.trenchVariability
                            ) {
                                //console.log("houve toque e a trincheira foi respeitada.+");
                                self.trenchs[trenchIndex].strength++;
                            }
                        }

                        if(resistanceIndex !== -1) { //existe resistência.
                            var trenchIndex = resistanceIndex;
                            var trench = currentTrenchs[trenchIndex];
                            if(candle.close < trench.value - self.trenchVariability) {
                                //console.log("houve rompimento.-");
                                //self.trenchs[trenchIndex].strength--;
                            }
                            else if(lastCandle.close >= trench.value - self.trenchVariability &&
                                lastCandle.close <= trench.value + self.trenchVariability &&
                                candle.close  >= trench.value - self.trenchVariability
                            ) {
                                //console.log("houve toque e a trincheira foi respeitada.-");
                                self.trenchs[trenchIndex].strength++;
                            }
                        }


                    });
                    fulfill('processado: ' + (index-20) + " " + index);
                })).then(function(data){
                    console.log(data);
                });
                buffer = [];
            }
        });

*/
        candleList.forEach(function(candle,i){
            if(i < 1)
                return;

            //apenas as trincheiras descobertas no momento.
            var currentTrenchs =  self.trenchs.filter(function(trench){
                return trench.index < i;
            });


            if(currentTrenchs.length < 0)
                return;


            //achar a resistência e o suporte do candle anterior.
            var lastCandle = candleList[i-1];

            currentTrenchs.push({value:lastCandle.close,candle : true});

            currentTrenchs = currentTrenchs.sort(function(a,b){
                return a.value - b.value;
            });

            var position = currentTrenchs.findIndex(function(trench){
                return typeof trench.candle !== 'undefined';
            });

            var supportIndex = position-1;
            var resistanceIndex = position;

            currentTrenchs = currentTrenchs.filter(function(trench){
                return typeof trench.candle === 'undefined';
            });

            supportIndex = typeof currentTrenchs[supportIndex] === 'undefined' ? -1 : supportIndex;
            resistanceIndex = typeof currentTrenchs[resistanceIndex] === 'undefined' ? -1 : resistanceIndex;


            if(supportIndex === -1 && resistanceIndex === -1)
                return;



            if(supportIndex !== -1) { //existe suporte.
                var trenchIndex = supportIndex;
                var trench = currentTrenchs[trenchIndex];
                if(candle.close > trench.value + self.trenchVariability) {
                    //console.log("houve rompimento.+");
                    //self.trenchs[trenchIndex].strength--;
                }
                else if(lastCandle.close >= trench.value - self.trenchVariability &&
                        lastCandle.close <= trench.value + self.trenchVariability &&
                        candle.close <= trench.value + self.trenchVariability
                ) {
                    //console.log("houve toque e a trincheira foi respeitada.+");
                    self.trenchs[trenchIndex].strength++;
                }
            }

            if(resistanceIndex !== -1) { //existe resistência.
                var trenchIndex = resistanceIndex;
                var trench = currentTrenchs[trenchIndex];
                if(candle.close < trench.value - self.trenchVariability) {
                    //console.log("houve rompimento.-");
                    //self.trenchs[trenchIndex].strength--;
                }
                else if(lastCandle.close >= trench.value - self.trenchVariability &&
                    lastCandle.close <= trench.value + self.trenchVariability &&
                    candle.close  >= trench.value - self.trenchVariability
                ) {
                    //console.log("houve toque e a trincheira foi respeitada.-");
                    self.trenchs[trenchIndex].strength++;
                }
            }


        });

        //console.log(self.trenchs );
        self.trenchs = self.trenchs.filter(function(trench){
            return trench.strength >= self.trenchConfirmations ;
        });
        //console.log(self.trenchs );

    };

    self.findTrenchsBack = function(candleList) {

        //inicialmente, todos os topos/fundos (dentro da margem de erro) são trincheira.
        //a cada toque de um topo ou fundo em uma trincheira, sua força aumenta.
        // mas se a trincheira for desrespeitada, sua força é zerada.
        //ao final do processo, apenas trincheiras com força self.trenchConfirmations serão consideradas válidas.


        //provável reversão de tendência = trincheira.
        self.trenchs = [];
        self.findTopsBottoms(candleList);
        var candleListLength = candleList.length;

        var minIndex = Math.max(0,candleListLength - self.trenchLifeTime);
        //console.log(minIndex);
        self.tops.forEach(function(top){
            if(top.index < minIndex )
                return;

            trenchIndex = self.trenchs.findIndex(function(trench){
                //console.log(top.value,top.value * (1-self.trenchVariability), "<=" , trench.value, "<=" ,top.value * (1+self.trenchVariability) );
                return trench.value > top.value - self.trenchVariability && trench.value < top.value + self.trenchVariability ;
            });
                       // console.log(trenchIndex);
            if(trenchIndex !== -1) {

                self.trenchs[trenchIndex].strength++;
            }
            else {
                self.trenchs.push({value : top.value, strength: 1});
            }
        });

        self.bottoms.forEach(function(bottom){

            if(bottom.index  < minIndex)
                return;

            trenchIndex = self.trenchs.findIndex(function(trench){
                //onsole.log(bottom.value,bottom.value * (1-self.trenchVariability), "<=" , trench.value, "<=" ,bottom.value * (1+self.trenchVariability) );
                return trench.value >= bottom.value * (1-self.trenchVariability) && trench.value <= bottom.value * (1+self.trenchVariability);
            });
            //console.log(trenchIndex);
            if(trenchIndex !== -1) {
                self.trenchs[trenchIndex].strength++;
            }
            else {
                self.trenchs.push({value : bottom.value, strength: 1});
            }
        });
        //console.log(self.trenchs );
        self.trenchs = self.trenchs.filter(function(trench){
            return trench.strength >= self.trenchConfirmations ;
        });
    };

    self.findTopsBottoms = function (candleList) {


        self.tops = [];
        self.bottoms = [];

        var tb = [];
        var confirmations = {
            need: self.topBottomConfirmations,
            top: 0,
            bottom: 0
        };

        var iterator;
        //detectandop topos e fundos;
        candleList.forEach(function(candle,i) {
            if(i < confirmations.need || i >= candleList.length - confirmations.need) //minimo e máximo
                return;

            if(candle.max < candleList[i-1].max && candle.min > candleList[i-1].min) {
                return; //inside bar, n representa evolução
            }
            confirmations.top = confirmations.bottom = 0;
            for(iterator = 1; iterator <= confirmations.need; iterator++) {
                if(candleList[i - iterator].max <= candle.max && candleList[i + iterator].max <= candle.max) {
                    confirmations.top++;
                }
                if(candleList[i - iterator].min >= candle.min && candleList[i + iterator].min >= candle.min) {
                    confirmations.bottom++;
                }
            };

            //detectando topos
            if(confirmations.top === confirmations.need) {


                if(tb.length === 0) { //adiciona logo
                    tb.push({
                        index: i,
                        value: candle.max,
                        type: self.tendencyType.BULLISH //topo
                    });
                    return;
                }
                else if( tb[tb.length-1].type !== self.tendencyType.BULLISH) { //ultimo contrário
                    if(i - tb[tb.length-1].index >= 2 || (((candle.max / tb[tb.length-1].value)  - 1) * 100) > 3 ) {
                        tb.push({
                            index: i,
                            value: candle.max,
                            type: self.tendencyType.BULLISH //topo
                        });
                        return;
                    }
                }
                else {
                    if(tb[tb.length-1].value <= candle.max) {
                        tb[tb.length-1].value = candle.max;
                        tb[tb.length-1].index = i;
                    }
                }
            }



            //detectando fundos
            if(confirmations.bottom === confirmations.need) {


                if(tb.length === 0) { //adiciona logo
                    tb.push({
                        index: i,
                        value: candle.min,
                        type: self.tendencyType.BEARISH //fundo
                    });
                    return;
                }
                else if( tb[tb.length-1].type !== self.tendencyType.BEARISH) { //ultimo contrário
                    if(i - tb[tb.length-1].index >= 2 || (((tb[tb.length-1].value / candle.min )  - 1) * 100) > 3 ) {
                        tb.push({
                            index: i,
                            value: candle.min,
                            type: self.tendencyType.BEARISH //fundo
                        });
                        return;
                    }
                }
                else {
                    if(tb[tb.length-1].value >= candle.min) {
                        tb[tb.length-1].value = candle.min;
                        tb[tb.length-1].index = i;
                    }
                }
            }

        });

        tb.forEach(function(t){
            if(t.type === self.tendencyType.BULLISH) {
                self.tops.push(t);
            }
            else {
                self.bottoms.push(t);
            }
        });

    };
    self.findTendencies = function(candleList) {

        self.findTopsBottoms(candleList);

        //detecção de tendências
        self.tendencies = [];

        var inclinations = {
            top: [],
            bottom: []
        };

        self.tops.forEach(function(top,i) {
           if(i < 1) {
               return;
           }

           var cur;
           if(self.tops[i-1].value < top.value) {
               cur = self.tendencyType.BULLISH;
           }
            if(self.tops[i-1].value > top.value) {
                cur = self.tendencyType.BEARISH;
            }
            if(self.tops[i-1].value === top.value) {
                cur = self.tendencyType.NEUTRAL;
            }

            inclinations.top.push({inc: cur, index: self.tops[i-1].index});
        });
        self.bottoms.forEach(function(bottom,i) {
            if(i < 1) {
                return;
            }

            var cur;
            if(self.bottoms[i-1].value < bottom.value) {
                cur = self.tendencyType.BULLISH;
            }
            if(self.bottoms[i-1].value > bottom.value) {
                cur = self.tendencyType.BEARISH;
            }
            if(self.bottoms[i-1].value === bottom.value) {
                cur = self.tendencyType.NEUTRAL;
            }

            inclinations.bottom.push({inc: cur, index: self.bottoms[i-1].index});
        });

        var maxIteration = Math.max(inclinations.top.length,inclinations.bottom.length);

        var currentTendency = self.tendencyType.UNDEFINED;
        for(var i = 0; i < maxIteration; i++) {


            //TODO: testar pegar o ponto índice mais próximo para comparação.


            var iterators = {
                top: i,
                bottom: i
            };
            if(typeof inclinations.top[iterators["top"]] === 'undefined') {
                iterators["top"] -= 1;
            }
            if(typeof inclinations.bottom[iterators["bottom"]]=== 'undefined') {
                iterators["bottom"] -= 1;
            }

            //se qualquer um dos dois for < 0, tendencia neutra;
            if(iterators["top"]  < 0) {
                currentTendency = currentTendency = self.tendencyType.NEUTRAL;
                self.tendencies.push({
                    index: inclinations.bottom[iterators["bottom"]].index,
                    pair: inclinations.bottom[iterators["bottom"]].index,
                    type: currentTendency
                });
                continue;
            }
            if(iterators["bottom"]  < 0) {
                currentTendency = currentTendency = self.tendencyType.NEUTRAL;
                self.tendencies.push({
                    index: inclinations.top[iterators["top"]].index,
                    pair: inclinations.top[iterators["top"]].index,
                    type: currentTendency
                });
                continue;
            }


            if(inclinations.top[iterators["top"]].inc === inclinations.bottom[iterators["bottom"]].inc) { //concordância de inclinação
                if(inclinations.top[iterators["top"]].inc !== currentTendency) { //mudança de tendência.
                    currentTendency = inclinations.top[iterators["top"]].inc;
                    self.tendencies.push({
                        index: Math.min(inclinations.top[iterators["top"]].index, inclinations.bottom[iterators["bottom"]].index),
                        pair: Math.max(inclinations.top[iterators["top"]].index,inclinations.bottom[iterators["bottom"]].index),
                        type: currentTendency
                    });
                }
            }
            else { //divergência de inclinação.

                //verificar se divergência continua com topo/fundo anterior.
                if(i > 0) {
                    var first = "top";
                    var second = "bottom";
                    if(inclinations.bottom[iterators["bottom"]].index < inclinations.top[iterators["top"]].index){ //bottom vem primeiro
                        first = "bottom";
                        second = "top";
                    }

                    //verificar anterior
                    if(inclinations[first][iterators[first]].inc === inclinations[second][iterators[second] -1].inc) { //concordância encontrada
                        if(inclinations[first][iterators[first]].inc !== currentTendency) { //mudança de tendência.
                            currentTendency = inclinations[first][iterators[first]].inc;
                            self.tendencies.push({
                                index: Math.min(inclinations[second][iterators[second] -1].index, inclinations[first][iterators[first]].index),
                                pair: Math.max(inclinations[second][iterators[second] -1].index,inclinations[first][iterators[first]].index),
                                type: currentTendency
                            });
                        }
                    }
                    else { //se ainda continuar divergente.
                        if(currentTendency !== self.tendencyType.NEUTRAL) {
                            currentTendency = self.tendencyType.NEUTRAL;
                            self.tendencies.push({
                                index: Math.min(inclinations.top[iterators["top"]].index, inclinations.bottom[iterators["bottom"]].index),
                                pair: Math.max(inclinations.top[iterators["top"]].index, inclinations.bottom[iterators["bottom"]].index),
                                type: currentTendency
                            });
                        }
                    }
                }
            }
        }


        //console.log(self.tendencies);

    };
    self.getActualTendency = function(candleList){
        self.findTendencies(candleList);

        if(self.tendencies.length === 0) {
            return {
                index: candleList.length-1,
                pair: candleList.length-1,
                type: self.tendencyType.UNDEFINED
            }
        }
        return self.tendencies[self.tendencies.length-1];
    };

    //media movel exponencial dos valores de um indicador
    self.MMEIndicator = function(indicatorList,periods) {

        var i;
        var mme = [];
        var sum;

        //zerando os primeiros valores
        for(i = 0; i < periods && i < indicatorList.length; i++){
            mme.push([null]);
        }


        if(i ===  indicatorList.length) //ainda n tem periodos suficientes pra calcular.
            return mme;

        //calculando a primeira média, q não é exponencial.
        sum = 0;
        for(i = 0; i < periods; i++) {
            //console.log(i,candleList[i].open);
            sum += indicatorList[i][0];
        }
        sum /= periods;
        mme.push([sum]);

        //calculando as exponenciais
        for(i = periods; i < indicatorList.length-1; i++ ) {

            mme.push([((indicatorList[i][0] - mme[i][0]) * (2/(periods+1) )) + mme[i][0]]);
            //console.log(result[i],candleList[i].open,i);
        }
        return mme;

    };






    //media movel exponencial da abertura
    self.MMEO = function(candleList,periods){

        var i;
        var mme = [];
        var sum;

        //zerando os primeiros valores
        for(i = 0; i < periods && i < candleList.length; i++){
            mme.push([null]);
        }


        if(i ===  candleList.length) //ainda n tem periodos suficientes pra calcular.
            return mme;

        //calculando a primeira média, q não é exponencial.
        sum = 0;
        for(i = 0; i < periods; i++) {
            //console.log(i,candleList[i].open);
            sum += candleList[i].open;
        }
        sum /= periods;
        mme.push([sum]);

        //calculando as exponenciais
        for(i = periods; i < candleList.length-1; i++ ) {

            mme.push([((candleList[i].open - mme[i][0]) * (2/(periods+1) )) + mme[i][0]]);
            //console.log(result[i],candleList[i].open,i);
        }
        return mme;
    };
    //media movel exponencial do fechamento
    self.MMEC = function(candleList,periods){
        var i;
        var mme = [];
        var sum;

        //zerando os primeiros valores
        for(i = 0; i < periods && i < candleList.length; i++){
            mme.push([null]);
        }


        if(i ===  candleList.length) //ainda n tem periodos suficientes pra calcular.
            return mme;

        //calculando a primeira média, q não é exponencial.
        sum = 0;
        for(i = 0; i < periods; i++) {
            //console.log(i,candleList[i].close);
            sum += candleList[i].close;
        }
        sum /= periods;
        mme.push([sum]);

        //calculando as exponenciais
        for(i = periods; i < candleList.length-1; i++ ) {

            mme.push([((candleList[i].close - mme[i][0]) * (2/(periods+1) )) + mme[i][0]]);
            //console.log(result[i],candleList[i].close,i);
        }
        return mme;
    };
    //media movel exponencial da máxima
    self.MMEH = function(candleList,periods){
        var i;
        var mme = [];
        var sum;

        //zerando os primeiros valores
        for(i = 0; i < periods && i < candleList.length; i++){
            mme.push([null]);
        }


        if(i ===  candleList.length) //ainda n tem periodos suficientes pra calcular.
            return mme;

        //calculando a primeira média, q não é exponencial.
        sum = 0;
        for(i = 0; i < periods; i++) {
            //console.log(i,candleList[i].max);
            sum += candleList[i].max;
        }
        sum /= periods;
        mme.push([sum]);

        //calculando as exponenciais
        for(i = periods; i < candleList.length-1; i++ ) {

            mme.push([((candleList[i].max - mme[i][0]) * (2/(periods+1) )) + mme[i][0]]);
            //console.log(result[i],candleList[i].max,i);
        }
        return mme;
    };
    //media movel exponencial da minima
    self.MMEL = function(candleList,periods){
        var i;
        var mme = [];
        var sum;

        //zerando os primeiros valores
        for(i = 0; i < periods && i < candleList.length; i++){
            mme.push([null]);
        }


        if(i ===  candleList.length) //ainda n tem periodos suficientes pra calcular.
            return mme;

        //calculando a primeira média, q não é exponencial.
        sum = 0;
        for(i = 0; i < periods; i++) {
            //console.log(i,candleList[i].min);
            sum += candleList[i].min;
        }
        sum /= periods;
        mme.push([sum]);

        //calculando as exponenciais
        for(i = periods; i < candleList.length-1; i++ ) {

            mme.push([((candleList[i].min - mme[i][0]) * (2/(periods+1) )) + mme[i][0]]);
            //console.log(result[i],candleList[i].min,i);
        }
        return mme;
    };
    //media movel exponencial da amplitude do corpo
    self.MMEB = function(candleList,periods){
        var i;
        var mme = [];
        var sum;

        //zerando os primeiros valores
        for(i = 0; i < periods && i < candleList.length; i++){
            mme.push([null]);
        }


        if(i ===  candleList.length) //ainda n tem periodos suficientes pra calcular.
            return mme;

        //calculando a primeira média, q não é exponencial.
        sum = 0;
        for(i = 0; i < periods; i++) {
            //console.log(i,candleList[i].getBody());
            sum += candleList[i].getBody();
        }
        sum /= periods;
        mme.push([sum]);

        //calculando as exponenciais
        for(i = periods; i < candleList.length-1; i++ ) {

            mme.push([((candleList[i].getBody() - mme[i][0]) * (2/(periods+1) )) + mme[i][0]]);
            //console.log(result[i],candleList[i].getBody(),i);
        }
        return mme;
    };
    //media movel exponencial da amplitude da sompra superior
    self.MMEUS = function(candleList,periods){
        var i;
        var mme = [];
        var sum;

        //zerando os primeiros valores
        for(i = 0; i < periods && i < candleList.length; i++){
            mme.push([null]);
        }


        if(i ===  candleList.length) //ainda n tem periodos suficientes pra calcular.
            return mme;

        //calculando a primeira média, q não é exponencial.
        sum = 0;
        for(i = 0; i < periods; i++) {
            //console.log(i,candleList[i].getUpperShadow());
            sum += candleList[i].getUpperShadow();
        }
        sum /= periods;
        mme.push([sum]);

        //calculando as exponenciais
        for(i = periods; i < candleList.length-1; i++ ) {

            mme.push([((candleList[i].getUpperShadow() - mme[i][0]) * (2/(periods+1) )) + mme[i][0]]);
            //console.log(result[i],candleList[i].getUpperShadow(),i);
        }
        return mme;
    };
    //media movel exponencial da amplitude da sompra inferior
    self.MMELS = function(candleList,periods){
        var i;
        var mme = [];
        var sum;

        //zerando os primeiros valores
        for(i = 0; i < periods && i < candleList.length; i++){
            mme.push([null]);
        }


        if(i ===  candleList.length) //ainda n tem periodos suficientes pra calcular.
            return mme;

        //calculando a primeira média, q não é exponencial.
        sum = 0;
        for(i = 0; i < periods; i++) {
            //console.log(i,candleList[i].getLowerShadow());
            sum += candleList[i].getLowerShadow();
        }
        sum /= periods;
        mme.push([sum]);

        //calculando as exponenciais
        for(i = periods; i < candleList.length-1; i++ ) {

            mme.push([((candleList[i].getLowerShadow() - mme[i][0]) * (2/(periods+1) )) + mme[i][0]]);
            //console.log(result[i],candleList[i].getLowerShadow(),i);
        }
        return mme;
    };
    self.MMS = function(candleList,periods){
        var i;
        var iGroup;
        var sum;
        var mms = [];

        //zerando os primeiros valores
        for(i = 0; i < periods && i < candleList.length; i++){
            mms.push([null]);
        }

        if(i ===  candleList.length) //ainda n tem periodos suficientes pra calcular.
            return mms;

        for(i = periods; i < candleList.length; i++ ) {
            sum = 0;
            for (iGroup = i - 1; iGroup >= i - periods; iGroup--) {
                sum += candleList[iGroup].close;
            }
            mms.push([sum / periods]);
        }
        return mms;
    };

    self.volumeMMS = function(candleList,periods){
        var i;
        var iGroup;
        var sum;
        var mms = [];

        //zerando os primeiros valores
        for(i = 0; i < periods && i < candleList.length; i++){
            mms.push([null]);
        }

        if(i ===  candleList.length) //ainda n tem periodos suficientes pra calcular.
            return mms;

        for(i = periods; i < candleList.length; i++ ) {
            sum = 0;
            for (iGroup = i - 1; iGroup >= i - periods; iGroup--) {
                sum += candleList[iGroup].volume;
            }
            mms.push([sum / periods]);
        }
        return mms;
    };
    self.IFR = function(candleList,periods){ //TODO: parece que o calculo ta errado...

        var ifr = [];
        var gainSum = 0;
        var lossSum = 0;
        var value;
        var i;
        var iGroup;
        var gainAverage;
        var lossAverage;
        var fr;

        //iniciando os primeiros valores
        for(i = 0; i < periods && i < candleList.length; i++){
            value = candleList[i].open - candleList[i].close;
            if(value > 0 ) {
                gainSum += value;
            }
            else {
                lossSum += value * -1;
            }
            ifr.push([null]);
        }

        if(i ===  candleList.length) //ainda n tem periodos suficientes pra calcular.
            return ifr;


        gainAverage = gainSum / periods;
        lossAverage = lossSum / periods;


        for(i = periods; i < candleList.length; i++ ) {

            gainSum = 0;
            lossSum = 0;

            for(iGroup = i-1; iGroup >= i-periods; iGroup--) {
                value = candleList[iGroup].open - candleList[iGroup].close;
                if(value > 0 ) {
                    gainSum += value;
                }
                else {
                    lossSum += value * -1;
                }
            }

            gainAverage = ((gainAverage * (periods - 1)) + gainSum) / periods;
            lossAverage = ((lossAverage * (periods - 1)) + lossSum) / periods;

            fr = gainAverage / lossAverage;

            ifr.push([
                100 - (100 / (1 + fr))
            ])
        }


        return ifr;
    };
    self.accumDist = function(candleList){
        var lastAdl = 0;
        var fd;
        var vfd;
        var adl;
        var ac = [];

        candleList.forEach(function(candle){

            //fluxo de dinheiro
            fd = ((candle.close - candle.min) - (candle.max - candle.close)) / (candle.max - candle.min);
            //volume do fluxo de dinheiro
            vfd = fd * candle.volume;

            adl = lastAdl  + vfd;
            lastAdl = adl;
            ac.push([adl]);
        });

        return ac;
    };
    self.bollinger = function(candleList,periods) {

        var i,iGroup;
        var bollinger = [];
        var sum;
        var sumSquare;
        var mms;
        var variancia;
        var desvio_padrao;

        //zerando os primeiros valores
        for(i = 0; i < periods && i < candleList.length; i++){
            bollinger.push([null,null]);
        }

        if(i ===  candleList.length) //ainda n tem periodos suficientes pra calcular.
            return bollinger;


        //calculando as bandas
        for(i = periods; i < candleList.length; i++ ) {

          sum = 0;
          sumSquare = 0;

          //console.log("--",i,candleList.length);
          for(iGroup = i-1; iGroup >= i-periods; iGroup--) {
              //console.log(iGroup);
              sum += candleList[iGroup].close;
              sumSquare += Math.pow(candleList[iGroup].close,2);
          }

          mms = sum / periods;
          variancia = (sumSquare / periods) - Math.pow(mms,2);
          desvio_padrao = Math.sqrt(variancia);

          //console.log(sum,sumSquare,mms,sumSquare / periods,Math.pow(mms,2),variancia,desvio_padrao);


          bollinger.push([mms + (2*desvio_padrao),mms - (2*desvio_padrao)]);

        }

        return bollinger;

    };
    self.bollingerWidth = function(candleList,periods) {

        var i,iGroup;
        var bollinger = [];
        var sum;
        var sumSquare;
        var mms;
        var variancia;
        var desvio_padrao;

        //zerando os primeiros valores
        for(i = 0; i < periods && i < candleList.length; i++){
            bollinger.push([null,null]);
        }

        if(i ===  candleList.length) //ainda n tem periodos suficientes pra calcular.
            return bollinger;


        //calculando as bandas
        for(i = periods; i < candleList.length; i++ ) {

            sum = 0;
            sumSquare = 0;

            //console.log("--",i,candleList.length);
            for(iGroup = i-1; iGroup >= i-periods; iGroup--) {
                //console.log(iGroup);
                sum += candleList[iGroup].close;
                sumSquare += Math.pow(candleList[iGroup].close,2);
            }

            mms = sum / periods;
            variancia = (sumSquare / periods) - Math.pow(mms,2);
            desvio_padrao = Math.sqrt(variancia);

            //console.log(sum,sumSquare,mms,sumSquare / periods,Math.pow(mms,2),variancia,desvio_padrao);
            var upperBand  =  mms + (2*desvio_padrao);
            var lowerBand  =  mms - (2*desvio_padrao);
            var middleBand = mms;

            //console.log(upperBand,lowerBand,middleBand,((upperBand - lowerBand) / middleBand) * 100 );
            //((Upper Band - Lower Band) / Middle Band) * 100

            bollinger.push([((upperBand - lowerBand) / middleBand) * 100]);
        }

        return bollinger;

    };

    self.debugBollingerPart = function(candleList,periods){
        var bollinger = self.bollinger(candleList,periods);
        var result = [];


        bollinger.forEach(function(boll){
            if(boll[0] === null) {
                result.push([null]);
                return;
            }
            result.push([boll[1] + (((boll[0]-boll[1]) / 8)*7)]);

        });
        return result;


    };


    self.drawLine = function(candlelist,value) {

        var dump = [];
        for(var i = 0; i < candlelist.length; i++)
            dump.push([value]);
        return dump;
    };


    self.DEBUG_getTops = function(candleList) {
        var tops = [];
        var found;

        self.findTopsBottoms(candleList);

        candleList.forEach(function(candle,candleIndex){
            found = self.tops.find(function(top){
                return top.index === candleIndex;
            });

            if(typeof found !== 'undefined') {
                tops.push([found.value * 1.0003]);
            }
            else {
                tops.push([null]);
            }

        });
        return tops;
    };
    self.DEBUG_getBottoms = function(candleList) {
        var bottoms = [];
        var found;

        self.findTopsBottoms(candleList);

        candleList.forEach(function(candle,candleIndex){
            found = self.bottoms.find(function(top){
                return top.index === candleIndex;
            });

            if(typeof found !== 'undefined') {
                bottoms.push([found.value * 0.9997]);
            }
            else {
                bottoms.push([null]);
            }

        });
        return bottoms;
    };

});
/**
 * Created by Ian on 06/01/2017.
 */

app.service("opportunityService",function($http,candleAnalysisService,indicatorService) {
    var self = this;




    self.applyOnList = function(strategyFunction,stockList,periodLength,callback){




        stockList.forEach(function(stock,i){

            var execute = function() {
                url = "stock/" + stock.ticker + "/trades/2000-01-01-00-00/2050-01-01-00-00/" + periodLength + "/0";
                $http.get(url).then(function (data) {

                    var candles = [];
                    //console.log(data.data);
                    data.data.forEach(function (element) {

                        var start = element.start.replace(" ", "-")
                        //.replace(":", "-");
                            .replace(":", "-");


                        var candle = new Candle(
                            start,
                            element.end,
                            element.min,
                            element.open,
                            element.close,
                            element.max,
                            element.quantity
                        );
                        candle.exchange = element.exchange;
                        candle.timestamp = element.timestamp;
                        candles.push(candle);
                    });
                    var result = strategyFunction(candles);

                    candles[candles.length-1].exchange = candles[0].exchange;
                    if(result === true) {
                        callback(stock.ticker, result,candles[candles.length-1],self.setStopAndTarget(candles[candles.length-1]));
                    }
                    else {
                        callback(stock.ticker, result,candles[candles.length-1]);
                    }
                    //console.log(stock.ticker, result);
                }, function (data) {
                    //console.error("erro em", url);
                    setTimeout(function(){
                        execute();
                    }, 200);   //dar um tempo aqui.
                });
            };
            setTimeout(function(){
                execute();
            }, 200 * i);   //dar um tempo aqui.

        });
    };


    self.detectCongestion = function (candleList) {

        //-de 1 indica bandas contraidas.
        //razão: -de 0.31 eh contração.



        var lastIndex = candleList.length-1;
        ///bandas de bollinger contraidas.
        var bw = indicatorService.bollingerWidth(candleList,20);
        var bwMME = indicatorService.MMEIndicator(bw,20);
        var max = bwMME[lastIndex][0];

        for(i = 1; i <= 39; i++)
            max = max < bwMME[lastIndex-i][0] ? bwMME[lastIndex-i][0] : max;



        bwMME = bwMME[lastIndex][0] / max;


        if(bwMME > 0.33)
            return "sem congestão";



        if(!candleList[lastIndex].isBullish())
            return "sem candle de alta";

        if(!candleAnalysisService.detect_LONG_BODY(candleList)) {
            return "sem candle de força";
        }

        if(!candleAnalysisService.detect_SHORT_SHADOW_UPPER(candleList))
            return "sem fechamento próximo da máxima";

        //checar rompimento de resistência
       indicatorService.findTrenchs(candleList);
        var trench = indicatorService.trenchs.filter(function(trench){
            return trench.value > candleList[lastIndex-1].close;

        }).sort(function(a,b){
            return a.value - b.value;
        })[0];

        if(typeof trench !== 'undefined') {

            if(candleList[lastIndex].open < trench.value && candleList[lastIndex].close > trench.value) {
                return true;
            }
            else {
                return "sem rompimento";
            }
        }
        else {
            return "sem resistência.";
        }



        return bwMME;
    };


    self.setStopAndTarget  = function(candle,ifr){


        //TODO: Talvez fosse bom limitar o ganho a 0.7% líquido, pra aumentar as chances de acertar. testar depois.
        //o sistema sugeriu uma operação em G10 NATU3 ~10:40, com p:26,11, t:26:50 e s:25:91.
        // Comprei por 25,94 e a ação chegou a valorizar 0,96% em ~15min.
        //E a operação operação foi concluída com ganho em 26,40.



        //TODO: colocar o limite de proxima resistencia tb.

        //se o ifr ta abaixo de 10, stop mais baixo.

        var stop = candle.min - 0.02;
        var targetMultiplier = 2;//1.57;


        var targetClose = candle.close + (targetMultiplier * (candle.close - stop));
        var target = targetClose;//Number(Math.round(targetClose+'e2')+'e-2');


        /*
            if(ifr < 12)
            stop -= 0.01; //aumenta em 1 centavo.
        */

        return {
            stop: stop,
            price: candle.close,
            target: target
            ///target_2: candle.close + (2 * (candle.close - stop))
        }
    };

    self.mmeStrategyStopTarget = function(candleList) {

      indicatorService.findTopsBottoms(candleList);

      //var tops = indicatorService.tops.filter(function(top){}).sort(function(a,b){});



      //stop = ultimo fundo abaixo do preço

      //target = ultimo topo acima do preço.
    };

    self.mmeStrategy = function(candleList,verbose) {


        //cruzamento pra cima após confirmação de tendencia de alta.
        var tendecy = indicatorService.getActualTendency(candleList);

        if(tendency.type !== indicatorService.tendencyType.BULLISH ){
            if(verbose)
                console.log("tendÊncia não é de alta.");
            return false;
        }

        //detecção de cruzamento
        var lastIndex = candleList.length - 1;
        var mme9 = indicatorService.MMEC(candleList,9);
        var mme21 = indicatorService.MMEC(candleList,21);

        for(var i = 4 ; i >= 0; i--) {
            var currentIndex = lastIndex - i;
            10
            4,3,2,1,0
            6,7,8,9,10

            if(i > 2) { //negativos
                if(mme9 > mme21) {
                    if(verbose)
                        console.log("não houve cruzamento.");
                    return false;
                }
            }
            if(i < 2){ //positivos
                if(mme9 < mme21) {
                    if(verbose)
                        console.log("não houve cruzamento.");
                    return false;
                }
            }
        }
    };



    self.detectOpportunity = function(candleList,verbose,trenchs){

        if(typeof verbose ===  'undefined'){
            verbose = false;
        }
        //verbose = true;
        //TODO: acho q fica melhor se botar os detectores em lógica fuzzy... ou algum peso. pq rompimento com força e volume grande pode n ser detectado por causa de médias móveis negativas.

        if(candleList.length < 21) {
            if(verbose)
                console.log("candleList insuficiente.");
            return false;
        }


        //return self.mmeStrategy(candleList,verbose);




        var lastIndex = candleList.length - 1;
        var lastCandle = candleList[lastIndex];
        //var beforeCandle = candleList[lastIndex - 1];
        var resistenceCandle = candleList[lastIndex - 2];

        if(typeof trenchs === 'undefined') {
            indicatorService.findTrenchs(candleList);
            trenchs = indicatorService.trenchs;
        }

        //ropendo a resistencia mais próxima ao candle anterior.
        trenchs = trenchs.filter(function(trench){
            return trench.value > resistenceCandle.close;
        }).sort(function(a,b){
            return a.value - b.value;
        });





        if(trenchs.length < 1){
            if(verbose)
                console.log("sem resistência próxima");
            return false;
        }

        if(lastCandle.open > trenchs[0].value) {
            if(verbose)
                console.log("sem rompimento de resistência.");
            return false;
        }

       // console.log(trenchs,lastCandle.open > trenchs[0].value);



        if(lastCandle.isBearish()) {
            if(verbose)
                console.log("candle de rompimento não é de alta.");
            return false;
        }


        //com candle de força
        //todo acho q pra ter certeza de q eh de força, seria bom ver se o corpo do candle é maior do que a média de alguns anteriores
        if(!candleAnalysisService.detect_LONG_BODY(candleList)){
            if(verbose)
                console.log("candle não tem corpo longo");
            return false;
        }



        //com sem sompra superior longa (fechamento próximo da máxima.
        //todo acho q pra ter certeza de q eh de força, seria bom ver se o corpo do candle é maior do que a média de alguns anteriores
        if(candleAnalysisService.detect_LONG_SHADOW_UPPER(candleList)){
            if(verbose)
                console.log("candle tem sombra superior longa");
            return false;
        }



        ///bandas de bollinger contraidas.
        var bw = indicatorService.bollingerWidth(candleList,20);
        var bwMME = indicatorService.MMEIndicator(bw,20);



        /*for(var i=0; i< 4; i++){
            if(bwMME[lastIndex-i][0] < bwMME[lastIndex-(i+1)][0]) {
                if(verbose)
                    console.log("bandas de bollinger não se contraíndo. sem congestão.");
                return false;
            }
        }*/




       /* if(!(bw[lastIndex][0]<bwMME[lastIndex][0])) {
            if(verbose)
                console.log("sem congestão.",bw[lastIndex][0],bwMME[lastIndex][0]);
            return false;
        }*/


        var bigestWidth = bw[candleList.length-1][0];
        bw.forEach(function (width,i) {
            var index = i;
            //var index = (candleList.length-1)-i;
           // console.log(bw[i][0],"<",bwMME[i][0],"?",bw[i][0]<bwMME[i][0]);
            //console.log(index);
            //if(index < candleList.length-61)
            //    return;
            //console.log(bw[index][0],bigestWidth);

            bigestWidth = bw[index][0] > bigestWidth ? bw[index][0] : bigestWidth;
        });
        var congestionFactor = 0.25; //.25 = 100% ciel3 g10
        if(bw[lastIndex][0] / bigestWidth > congestionFactor) {
            if(verbose)
                console.log("sem congestão.",bw[lastIndex][0] / bigestWidth);
            return false;
        }










       /*
       //está em  neutra ou alta.
        var tendency = indicatorService.getActualTendency(candleList);
        if(tendency.type != indicatorService.tendencyType.BULLISH) {
            if(verbose)
                console.log("tendencia não neutra nem de alta");
            return false;
        }
        */

        //volume acima da media
        var volumeRate = lastCandle.volume / indicatorService.volumeMMS(candleList,21)[lastIndex];
        volumeRate -= 1;
        if(volumeRate < 0.5) {
            if(verbose)
                console.log("volume não está acima da média.");
            return false;
        }





        //ifr menor que 90
        if(indicatorService.IFR(candleList,2)[lastIndex] > 80) {
            if(verbose)
                console.log("ifr maior que 80. marcar pullback");
            return false;
        }

        var mme9 = indicatorService.MMEC(candleList,9);
        var mme21 = indicatorService.MMEC(candleList,21);

        //mme9 acima da mme21
        if(mme9[lastIndex][0] <  mme21[lastIndex][0]) {
            if(verbose)
                console.log("mme9 < mme21",mme9[lastIndex][0] - mme21[lastIndex][0]);
            return false;
        }


        //mme's positivamente inclinadas //acho q eh mais pra medio prazo.
        for(var i=0; i< 4; i++){
            if(mme9[lastIndex-i][0] < mme9[lastIndex-(i+1)][0]) {
                if(verbose)
                    console.log("mme9 não inclinada positivamente");
                return false;
            }
            if(mme21[lastIndex-i][0] < mme21[lastIndex-(i+1)][0]) {
                if(verbose)
                    console.log("mme21 não inclinada positivamente");
                return false;
            }
        }

        //console.error(volumeRate);
        return true; //testar o nivel de acerto até aqui.

        var boll = indicatorService.bollinger(candleList,20);
        if(lastCandle.close > boll[lastIndex][1] + (((boll[lastIndex][0]-boll[lastIndex][1]) / 8)*7)){
            if(verbose)
                console.log("fechamento proximo à bollinger superior");
            return false;
        }






        return true;


    };


















    //stopLoss: minima do candle de oportunidade - 0,02 (cuidado com o papa stop);
    //objetivo: 0,02 da proxima resistÊncia, até no máx preço de compra (fechamento) + (2*(candle.min - stop.loss))





});
/**
 * Created by Ian on 06/01/2017.
 */
app.service("strategyTestService",function($http,candleAnalysisService,opportunityService,indicatorService) {
    var self = this;


    self.maxMemory = 5; //numero máximo de periodos q ele vai manter na memoria durante a detecção de padrões.




    self.detectionTest = function(periods){
        //self.maxPeriods = periods;

        candleList = [];

        var url = "stock/"+self.stock.code+"/trades/"+self.stock.start+"/"+self.stock.end+"/"+self.stock.periodLength+"/"+self.stock.maxPeriods;
        var candleList = [];
        console.info("Requisitando",url);
        $http.get(url).then(function(data){


            console.info("Convertendo",data.data.length,"periodos.");
            data.data.forEach(function(element){
                candleList.push(new Candle(
                    element.start,
                    element.end,
                    element.min,
                    element.open,
                    element.close,
                    element.max,
                    element.quantity
                ));
            });
            console.info("Pronto.");




            var detectedPatterns = {};

            for( i = candleList.length-1; i >= 0 ; i--) {

                var chunk = [];
                var range = Math.min(self.maxMemory-1,i);


                for(j = 0; j <= range; j++ ) {
                    chunk.push(candleList[i-j]);
                }

                candleAnalysisService.detectAll(chunk).forEach(function(pattern){

                    if(pattern[2]) {
                        if(typeof detectedPatterns[pattern[1]] === 'undefined') {
                            detectedPatterns[pattern[1]] = {
                                detections: []
                            }
                        }
                        detectedPatterns[pattern[1]].detections.push({
                            index: i,
                            //se future movement for positivo, houve alta.
                            futureMovement: i < candleList.length-1 ? candleList[i+1].close - candleList[i].close : 0
                        });
                    }

                });
            }




            var temp = [];


            for (var key in detectedPatterns) {
                temp.push({
                    name: key,
                    detections: detectedPatterns[key].detections
                })
            };

            detectedPatterns = temp;



            var analysis = [];
            detectedPatterns.forEach(function(detectedPattern){
                var precision = -1;
                var match = 0;
                var type = candleAnalysisService.candlePatterns[detectedPattern.name].type;

                if(type === 1) {//bullish
                    detectedPattern.detections.forEach(function (detection) {
                        if(detection.futureMovement > 0)
                            match++;
                    });
                }
                else if(type === -1){ //bearish
                    detectedPattern.detections.forEach(function (detection) {
                        if(detection.futureMovement < 0)
                            match++;
                    });
                }
                precision =  match / detectedPattern.detections.length;


                analysis.push({
                    name: detectedPattern.name,
                    times: detectedPattern.detections.length,
                    precision: precision
                });
            });


            analysis = analysis.sort(function(a,b){
                return b.precision-a.precision;
            });

            analysis.forEach(function(detectedPattern){
                console.log(detectedPattern.name,":",detectedPattern.times,'detections. --- Precision:', detectedPattern.precision);
            });














        },function(data){

        });

    };

    self.getPreciseCandles = function(macroList,microList){
        var macroIndex = macroList.length-1;
        var microIndex = microList.length-1;
        var macroDuration = macroList[macroIndex].timestamp - macroList[macroIndex-1].timestamp;
        var microDuration = microList[microIndex].timestamp - microList[microIndex-1].timestamp;
        equivalence = macroDuration / microDuration;

        var lastTimestamp = macroList[macroIndex].timestamp;

        return microList.filter(function(candle){
            var match = candle.timestamp >= lastTimestamp && candle.timestamp < lastTimestamp + (60*(equivalence));
            return match;
        });
    };

    self.opportunityTest = function(ticker,periodLength,verbose,resultCallback,statusUpdateCallback) {

        verbose = typeof verbose !== 'undefined' ? verbose : false;

        var macroPeriodLength;
        switch(periodLength){
            default: macroPeriodLength = 60; break;
            case 1: macroPeriodLength = 5; break;
            case 5: macroPeriodLength = 15; break;
            //case 10: macroPeriodLength = 30; break;
           // case 15: macroPeriodLength = 60; break;
        }

        var bullOne = this;
        bullOne.test = function(ticker,periodLength,verbose,resultCallback,statusUpdateCallback) {

            var url = "stock/"+ticker+"/trades/2000-01-01-00-00/2020-01-01-00-00/1/0";
            minuteCandleList = [];


            if(typeof statusUpdateCallback !== 'undefined')
                statusUpdateCallback("Inicializando...");


            if(verbose)console.info("Obtendo limite histórico...");
            $http.get(url).then(function(data){

                if(data.data.length <1) {
                    console.error("não foi possivel obter o limite histórico. Limite Histórico.",url);
                    return;
                }

                data.data[0].start = data.data[0].start.replace(" ", "-").replace(":", "-");
                data.data[0].start = data.data[0].start.split("-");
                apiLimitDate = new Date(data.data[0].start[0],data.data[0].start[1],data.data[0].start[2],data.data[0].start[3],data.data[0].start[4],0,0);
                //console.info("Limite histórico para",ticker+":", apiLimitDate);

                data.data.forEach(function(element,ei){

                    var start;
                    if(ei > 0) {
                        start = element.start.replace(" ", "-").replace(":", "-").replace(":", "-").split("-");
                    }
                    else {
                        start = element.start;
                    }

                    // start = (new Date(start[0],start[1],start[2],start[3],start[4],0,0)).getTime()/1000;

                    //element.timestamp = (new Date(start[0],start[1],start[2],start[3],start[4],0,0)).getTime()/1000;
                    var candle = new Candle(
                        start.join("-"),
                        element.end,
                        element.min,
                        element.open,
                        element.close,
                        element.max,
                        element.quantity,
                        element.timestamp
                    );
                    minuteCandleList.push(candle);
                });


                var url = "stock/"+ticker+"/trades/"+minuteCandleList[0].start+"/2020-01-01-00-00/"+macroPeriodLength+"/0";
                macroCandleList = [];
                if(typeof statusUpdateCallback !== 'undefined')
                    statusUpdateCallback("Obtendo macroperíodos("+macroPeriodLength+")...");

                if(verbose)console.info("Obtendo macroperíodos("+macroPeriodLength+")...");
                $http.get(url).then(function(data) {
                    data.data.forEach(function (element) {

                        var start = element.start.replace(" ", "-")
                        //.replace(":", "-");
                            .replace(":", "-");

                        var candle = new Candle(
                            start,
                            element.end,
                            element.min,
                            element.open,
                            element.close,
                            element.max,
                            element.quantity,
                            element.timestamp
                        );
                        macroCandleList.push(candle);
                    });
                    if (verbose) console.info("Pronto.");

                    url = "stock/"+ticker+"/trades/"+minuteCandleList[0].start+"/2020-01-01-00-00/"+periodLength+"/0";
                    var candleList = [];


                    if(typeof statusUpdateCallback !== 'undefined')
                        statusUpdateCallback("Requisitando dados...");


                    if(verbose)console.info("Requisitando",url);
                    $http.get(url).then(function(data) {

                        //if(typeof statusUpdateCallback !== 'undefined')
                            statusUpdateCallback("Processando Períodos...");


                        if (verbose) console.info("Convertendo", data.data.length, "periodos.");
                        data.data.forEach(function (element) {

                            var start = element.start.replace(" ", "-")
                            //.replace(":", "-");
                                .replace(":", "-");

                            var candle = new Candle(
                                start,
                                element.end,
                                element.min,
                                element.open,
                                element.close,
                                element.max,
                                element.quantity,
                                element.timestamp
                            );
                            candleList.push(candle);
                        });
                        if (verbose) console.info("Pronto.");


                        indicatorService.findTrenchs(candleList);



                        operations = [];
                        var opportunityFound;
                        for (i = 20; i < candleList.length; i++) {



                            //separar os macroChunks.
                            var chunk = [];
                            for (j = 0; j <= i; j++) {
                                chunk.push(candleList[j]);
                            }

                            var preciseLast = self.getPreciseCandles(chunk,minuteCandleList);
                            if(preciseLast.length === 0)
                                continue;
                            //console.log(preciseLast);

                            //tirando o ultimo elemento.


                            var lastCandle = new Candle(
                                preciseLast[0].start,
                                preciseLast[0].end,
                                1000000000,
                                preciseLast[0].open,
                                0,
                                0,
                                0,
                                preciseLast[0].timestamp
                            );
                            opportunityFound = false;

                            do {
                                chunk.pop();

                                lastCandle.end =  preciseLast[0].end;
                                lastCandle.start =  preciseLast[0].start;
                                lastCandle.close =  preciseLast[0].close;
                                lastCandle.volume +=  preciseLast[0].volume;
                                lastCandle.timestamp =  preciseLast[0].timestamp;
                                lastCandle.min =  preciseLast[0].min <  lastCandle.min ? preciseLast[0].min : lastCandle.min;
                                lastCandle.max =  preciseLast[0].max >  lastCandle.max ? preciseLast[0].max : lastCandle.max;
                                lastCandle.max =  preciseLast[0].max >  lastCandle.max ? preciseLast[0].max : lastCandle.max;

                                preciseLast.shift();

                                chunk.push(lastCandle);



                                //fazer os testes com a candleList agora.
                                if(opportunityService.detectOpportunity(chunk,verbose,indicatorService.trenchs)) {



                                    //se já tiver adicionado para este chunk, continua.

                                    if(opportunityFound) {
                                        //console.log("achou");
                                        continue;
                                    }


//TODO: Colocar todo comportamento de filtragem de oportunidade em uma função q reflita a estratégia.
                                    //verificação do macroPeriodo.
                                    var macroPeriodIndex = macroCandleList.findIndex(function(auxCandle){
                                        return auxCandle.timestamp > chunk[i].timestamp;
                                    });
                                    macroPeriodIndex--;

                                    if(macroPeriodIndex < 0) {
                                        console.log("erro G"+macroPeriodLength,macroPeriodIndex);
                                        continue;
                                    }


                                    var chunk3 = [];
                                    for(j = 0; j <= macroPeriodIndex; j++) {
                                        chunk3.push(macroCandleList[j]);
                                    }

                                    var macroTendency = indicatorService.getActualTendency(chunk3).type;


                                    if(macroTendency === indicatorService.tendencyType.BEARISH) {
                                        if(verbose) console.log("Tendência G"+macroPeriodLength+" de baixa. ");
                                        continue;
                                    }


                                    var st = chunk[i].start.split("-");
                                    var startDate = (new Date(st[0],st[1]-1,st[2],st[3],st[3],0,0)).getTime();
                                    var buyLimit = (new Date(st[0],st[1]-1,st[2],17,0,0,0)).getTime();

                                    if(startDate >= buyLimit) { //limite de operação dayTrade.
                                        if(verbose) console.log("Limite de operação daytrade atingido.");
                                        continue;
                                    }

                                    var ifr = indicatorService.IFR(chunk,2)[i][0];
                                    operation = opportunityService.setStopAndTarget(chunk[i],ifr);

                                    if(operation.target === operation.stop) { //diferença insuficiente.
                                        continue;
                                    }


////////////////

                                    opportunityFound = true;

                                    if(verbose)console.log("ADD",i,operation);
                                    operation.index = i;
                                    operation.start = "" + chunk[i].start;
                                    operation.ticker = ticker;
                                    operation.limitDate = false;
                                    operation.timestamp = parseInt(chunk[i].timestamp);
                                    operations.push(operation);
                                    //capital -= 10000;
                                }



                            }while(preciseLast.length > 0 && !opportunityFound);

                        }


                        //depois de achar as oportunidades, resolvê-las.
                        var gain = 0;
                        var loss =0;
                        var accumGain = 1;
                        var accumLoss = 1;
                        var accumTotal = 1;
                        var first = 0;
                        var last = 0;

                        if(typeof statusUpdateCallback !== 'undefined')
                            statusUpdateCallback("Processando Oportunidades...");
                        operations.forEach(function (operation,oi) {
                            if(oi === 0) {
                                first = operation.start;
                            }
                            last = operation.start;
                           var result = self.completeOperation(operation,candleList,oi,verbose,minuteCandleList);

                           if(result > 0) {
                               gain++;
                               accumGain *= 1 + result;

                           }
                           else {
                               loss++;
                               accumLoss *= 1 + (result * -1);
                           }
                            accumTotal *= 1 + result;
                        });

                        accumGain -= 1;
                        accumGain *= 100;
                        accumLoss -= 1;
                        accumLoss *= 100;
                        accumTotal -= 1;
                        accumTotal *= 100;


                        if(typeof resultCallback !== "undefined") {
                            resultCallback(ticker,{
                                first : "" + first,
                                last :  "" + last,
                                gain : parseInt(gain),
                                loss : parseInt(loss),
                                accGain : parseFloat(accumGain.toFixed(2)),
                                accLoss : parseFloat(accumLoss.toFixed(2)),
                                accTotal : parseFloat(accumTotal.toFixed(2)),
                                operations: operations
                            });
                        }
                    },function(data){
                       bullOne.test(ticker,periodLength,verbose,resultCallback,statusUpdateCallback);
                    })
                },function(data){
                    bullOne.test(ticker,periodLength,verbose,resultCallback,statusUpdateCallback);
                })
            },function(data){
                bullOne.test(ticker,periodLength,verbose,resultCallback,statusUpdateCallback);
            });
        };
        bullOne.test(ticker,periodLength,verbose,resultCallback,statusUpdateCallback);
    };

    self.completeOperation = function (operation,candleList,oi,verbose,minuteCandleList){




        //var operationStartTimestamp = operation.start.split("-");
        //operationStartTimestamp = (new Date(operationStartTimestamp[0],operationStartTimestamp[1],operationStartTimestamp[2],operationStartTimestamp[3],operationStartTimestamp[4],0,0)).getTime()/1000;
        //console.log(operation);

        var currentCandles = minuteCandleList.filter(function(candle){
            return candle.timestamp > operation.timestamp;
        });
        //console.log(currentCandles);
        //return;



        //currentCandles.shift(); //removendo o primeiro, pq eh o candle de abertura.

        if( currentCandles.length < 1) {
            console.log("candlelist vazia: erro:",oi);
            //self.completeOperation(operation,candleList,oi);
        }


        else {

            var incomplete = true;
            var operationDate = operation.start.split("-");
            //operationDate = new Date(operationDate[0],operationDate[1],operationDate[2],operationDate[3],operationDate[4],0,0);
            var currentIndex = 0;
            while(incomplete && currentIndex < currentCandles.length){
                var candle = currentCandles[currentIndex];
                currentIndex++;


                //console.log("ok",operation.target <= candle.max,candle.min < operation.stop);



                //ajuste para evitar erro por gap nas datas.


                if(operation.target <= candle.max) { //GAIN

                    tax = (operation.target / operation.price)-1;
                    if(verbose)console.warn('GAIN ----',oi);
                    if(verbose)console.info({s:operation.stop,t:operation.target,p:operation.price,time: candleList[operation.index].start});
                    if(verbose)console.info(candleList[operation.index].start);
                    if(verbose)console.info(candle.start);

                    operation.end =  candle.start;
                    operation.result =  true;
                    //operation.url =  ""+url;


                    incomplete = false;
                    //complete = true;
                    continue;
                }
                else if(candle.min < operation.stop) { //loss
                    tax = (1 - (operation.stop / operation.price)) * -1;
                    if(verbose)console.error('LOSS ----',oi);
                    if(verbose)console.info({s:operation.stop,t:operation.target,p:operation.price,time: candleList[operation.index].start});
                    if(verbose)console.info(candleList[operation.index].start);
                    if(verbose)console.info(candle.start,candle.min);

                    operation.end =  candle.start;
                    operation.result =  false;

                    incomplete = false;
                    //complete = true;
                    continue;
                }
            }





            //console.log(operation,incomplete,currentIndex,candleList[operation.complete]);


            if(incomplete && operation.limitDate) {
                console.error(currentCandles.length, oi, 'EEEEEEEEEEEEEEEEEEEND' );
            }
            if(!incomplete) {
                    return tax;
            }
            return 0;
        }
    };


});
/**
 * Created by Ian on 29/12/2016.
 */
app.controller("candleController",function($scope,$http,indicatorService,candleAnalysisService,strategyTestService,opportunityService,$window,$interval){


    //http://stockbot.app/stock/PETR4/trades/2015-07-02-13-45-00/2015-07-02-16-18-00/5/2000
    $scope.stock = {
        code : 'PETR4',
        start :'2017-01-06 10:15',
        end :'2017-01-06 17:30',
        periodLength : 10,
        maxPeriods : 0
    };


    $scope.renkoResolution = 3;





    var IBrX50 = [
        "ABEV3","BBAS3","BBDC3","BBDC4","BBSE3",
        "BRFS3","BRKM5","BRML3","BVMF3","CCRO3",
        "CIEL3","CMIG4","CPFE3","CSAN3","CSNA3",
        "CTIP3","EGIE3","EMBR3","ENBR3","EQTL3",
        "ESTC3","FIBR3","GGBR4","GOAU4","HYPE3",
        "ITSA4","ITUB4","JBSS3","KLBN11","KROT3",
        "LAME4","LREN3","MRVE3","MULT3","NATU3",
        "PCAR4","PETR3","PETR4","QUAL3","RADL3",
        "RENT3","RUMO3","SBSP3","SUZB5","UGPA3",
        "USIM5","VALE3","VALE5","VIVT4","WEGE3"
    ];

    var IBrX100 = [
        "ABEV3","ALPA4","ALSC3","ALUP11","BBAS3",
        "BBDC3","BBDC4","BBSE3","BEEF3","BRAP4",
        "BRFS3","BRKM5","BRML3","BRPR3","BRSR6",
        "BTOW3","BVMF3","CCRO3","CESP6","CIEL3",
        "CMIG4","CPFE3","CPLE6","CSAN3","CSMG3",
        "CSNA3","CTIP3","CVCB3","CYRE3","DTEX3",
        "ECOR3","EGIE3","ELET3","ELET6","ELPL4",
        "EMBR3","ENBR3","EQTL3","ESTC3","EZTC3",
        "FIBR3","FLRY3","GFSA3","GGBR4","GOAU4",
        "GOLL4","HGTX3","HYPE3","IGTA3","ITSA4",
        "ITUB4","JBSS3","KLBN11","KROT3","LAME3",
        "LAME4","LEVE3","LIGT3","LREN3","MDIA3",
        "MGLU3","MPLU3","MRFG3","MRVE3","MULT3",
        "MYPK3","NATU3","ODPV3","PCAR4","PETR3",
        "PETR4","POMO4","PSSA3","QGEP3","QUAL3",
        "RADL3","RAPT4","RENT3","RUMO3","SANB11",
        "SBSP3","SEER3","SMLE3","SMTO3","SULA11",
        "SUZB5","TAEE11","TIET11","TIMP3","TOTS3",
        "TRPL4","TUPY3","UGPA3","USIM5","VALE3",
        "VALE5","VIVT4","VLID3","VVAR11","WEGE3"
    ];





    $scope.stockWatchList = [
        "NATU3","BBSE3","VALE5","RUMO3","CSAN3",
        "CSNA3","CMIG4","RENT3","QUAL3","CCRO3",
        "ITSA4","MRVE3","JBSS3","GOAU4","USIM5",
        "CIEL3","MULT3","BBDC3","SBSP3","ABEV3",
        "BRKM5","ENBR3","EMBR3","VIVT3"
    ];

    $scope.stockWatchList = IBrX100; //pra fins de teste


    $scope.stockWatchs = [];
    $scope.stockWatchList.forEach(function(ticker){
        $scope.stockWatchs.push({
            index: $scope.stockWatchs.length,
            ticker:ticker,
            operations: [],
            operationsNum : 0,
            first:0,
            last:0,
            gain:0,
            gainP:0,
            loss:0,
            lossP:0,
            accGain:0,
            accLoss:0,
            accTotal: 0
        });
    });

    var d = new Date();
    if(d.getHours() < 9)
        d.setDate(d.getDate()-1);
    if(d.getDate() < 1)
        d.setMonth(d.getMonth()-1);

    var day = ("00" + d.getDate()).slice(-2);
    var month = ("00" + (d.getMonth()+1)).slice(-2);
    $scope.stock.start = d.getFullYear() + "-" + month + "-" + day + " 07:00";
    $scope.stock.end = d.getFullYear() + "-" + month + "-" + day + " 20:00";



    $scope.selectedAnalysis = function() {
        var maxIndex =  $scope.candleList.length -1;
        if(typeof selected !== 'undefined') {
            maxIndex = selected.row;
        }
        var chunk = [];
        for(var i = 0; i <= maxIndex; i++)
            chunk.push($scope.candleList[i])

        //console.log(chunk.length);

       console.log("------reconhecendo...");
       var detected = false;
       candleAnalysisService.detectAll(chunk).forEach(function(result){
           if(result[2]) {
               console.log(result[1]);
               detected = true;
           }
       });
       if(!detected)
           console.log("Sem padrões reconhecidos.");



    };

    $scope.resultList = [];
    $scope.cancelChecks;
    $scope.applyOnList = function(){

        if(typeof $scope.cancelChecks !== 'undefined'){
            $interval.cancel($scope.cancelChecks)
        }

        $scope.cancelChecks = $interval($scope.applyOnList,61000);
        console.log("executando checagem de oportunidade.",new Date());


        var audio = new Audio('alert1.mp3');


        $scope.stockWatchs.forEach(function(stock){
            stock.operationsNum = 0;
        });



        $scope.resultList = [];
       opportunityService.applyOnList(opportunityService.detectOpportunity ,$scope.stockWatchs,$scope.stock.periodLength,function(ticker,result,lastCandle,target){
            //$scope.resultList = [];
            $scope.resultList.push({ticker: ticker, result:result,target:target, lastCandle:lastCandle});


           $stock = $scope.stockWatchs[$scope.stockWatchs.findIndex(function(stock){
                return stock.ticker === ticker;
            })];
           //$stock.operationsNum = result ? 0 : result;
           $stock.last = lastCandle.end;
           $stock.first = lastCandle.exchange;

           if(result === true) {






               //TODO: Quando multiplas estratégias forem utiilzadas, mostrar também ql estratégia achou a oportunidade
               // e calcular ql é a confiabilidade/performance da estratégia praquela ação específica.


               console.warn("found: ", ticker,target);
               audio.play();
           }



            if($scope.resultList.length === $scope.stockWatchs.length) {


               ///registrar as operaçoes encontradas


                $scope.resultList.forEach(function(result){

                    if(result.result === false) //o && false é DEBUG
                        return;

                    /*if(typeof result.target === 'undefined'){ //DEBUG
                        result.target = {
                            price:result.ticker,
                            target:0,
                            stop:0
                        }
                    }*/

                    var stock = $scope.stockWatchs[$scope.stockWatchs.findIndex(function(stock){
                        return stock.ticker === result.ticker;
                    })];

                    stock.operations.push({
                        stop: result.target.stop,
                        price: result.target.price,
                        target: result.target.target,
                        start : result.lastCandle.start,
                        ticker : result.ticker,
                        limitDate : false,
                        timestamp : result.lastCandle.timestamp
                    });

                    stock.operationsNum = stock.operations.length;

                    var  url = "stock/operation";
                    var data = {
                        ticker: result.ticker,
                        timestamp: result.lastCandle.timestamp, //TODO esse tempo aqui tem q ser o tempo q a oportunnidade foi achada, n o tempo do periodo.
                        price: result.target.price,
                        stop: result.target.stop,
                        target: result.target.target,
                        type: "c",
                        periodLength: $scope.stock.periodLength
                    };

                    this.send = function () {
                        $http.post(url, data).then(
                            function (data) {

                            },
                            function (data) {
                                this.send();
                            }
                        );
                    };
                    this.send();
                });

                $scope.resultList = [];

            }
       });
    };

    $scope.getActualTendency = function() {

        $scope.actualTendency = indicatorService.getActualTendency($scope.candleList).type;
        console.log($scope.actualTendency)
    };

    $scope.opportunityList = function(){

    };


    $scope.detectionTest = function(ticker) {

        console.log(ticker);

        var currentWatch;
        if(typeof ticker === "undefined" ) {
            currentWatch = 0;
        }


        $scope.stockWatchs.forEach(function(stock,i){
            if(typeof ticker !== "undefined" && ticker !== stock.ticker ) {
                return;
            }
            if(typeof ticker !== "undefined" && ticker === stock.ticker ) {
                currentWatch = i;
            }

            stock.operations= [];
            stock.operationsNum = 0;
            stock.first=0;
            stock.last=0;
            stock.gain=0;
            stock.gainP=0;
            stock.loss=0;
            stock.lossP=0;
            stock.accGain=0;
            stock.accLoss=0;
            stock.accTotal= 0;
        });


        var completeTest = function(tick,results){


            var stock = $scope.stockWatchs.find(function(stock){
                return stock.ticker === tick;
            });

            stock.operations = results.operations;
            stock.operationsNum = stock.operations.length;
            stock.first = "" + results.first;
            stock.last = "" + results.last;
            stock.gain = "" + results.gain;
            stock.gainP = stock.operationsNum > 0 ? ((results.gain * 100) /  stock.operationsNum).toFixed(2) : 0;
            stock.loss = "" + results.loss;
            stock.lossP = stock.operationsNum > 0 ?  ((results.loss * 100) /  stock.operationsNum).toFixed(2) : 0;
            stock.accGain = "" + results.accGain;
            stock.accLoss = "" + results.accLoss;
            stock.accTotal = "" + results.accTotal;

            currentWatch++;
            if(typeof ticker === 'undefined' && currentWatch < $scope.stockWatchs.length) {
                strategyTestService.opportunityTest ( $scope.stockWatchs[currentWatch].ticker,$scope.stock.periodLength,typeof ticker !== "undefined",completeTest,statusUpdate);
            }

            $scope.stockWatcherAll = {
                operationsNum:0,
                gain : 0,
                loss : 0,
                accGain : 1,
                accLoss : 1,
                accTotal : 1
            };

            $scope.stockWatchs.forEach(function(stock){


                $scope.stockWatcherAll.operationsNum += parseInt(stock.operationsNum);
                $scope.stockWatcherAll.gain += parseInt(stock.gain);
                $scope.stockWatcherAll.loss += parseInt(stock.loss);
                $scope.stockWatcherAll.accGain *= parseFloat(1 + (stock.accGain/100));
                $scope.stockWatcherAll.accLoss *= parseFloat(1 + (stock.accLoss/100));
                $scope.stockWatcherAll.accTotal *= parseFloat(1 + (stock.accTotal/100));
            });

            $scope.stockWatcherAll.gainP = (($scope.stockWatcherAll.gain * 100) /  $scope.stockWatcherAll.operationsNum).toFixed(2);
            $scope.stockWatcherAll.lossP = (($scope.stockWatcherAll.loss * 100) /  $scope.stockWatcherAll.operationsNum).toFixed(2);
            $scope.stockWatcherAll.accGain = (($scope.stockWatcherAll.accGain - 1) * 100).toFixed(2);
            $scope.stockWatcherAll.accLoss = (($scope.stockWatcherAll.accLoss - 1) * 100).toFixed(2);
            $scope.stockWatcherAll.accTotal = (($scope.stockWatcherAll.accTotal - 1) * 100).toFixed(2);

        };


        var statusUpdate = function(message) {
            $scope.stockWatchs[currentWatch].first = message;
        };

        strategyTestService.opportunityTest ( $scope.stockWatchs[currentWatch].ticker,$scope.stock.periodLength,typeof ticker !== "undefined",completeTest,statusUpdate);










    };

    $scope.testTableSort = function(collum) {
        this.invert = this.lastCollum === collum ? !(this.invert) : false;
        var self = this;
        $scope.stockWatchs = $scope.stockWatchs.sort(function(a,b){
            var aValue = (""+a[collum]).split('-');
            if(aValue.length === 5) {
                aValue = (new Date(aValue[0],aValue[1],aValue[2],aValue[3],aValue[4],0,0)).getTime();

            }
            else {
                aValue =  a[collum];
            }
            var bValue = (""+b[collum]).split('-');
            if(bValue.length === 5) {
                bValue = (new Date(bValue[0],bValue[1],bValue[2],bValue[3],bValue[4],0,0)).getTime();

            }
            else {
                bValue =  b[collum];
            }


            if(self.invert)
                return aValue - bValue;
            else
                return bValue - aValue;

        });
        this.lastCollum = collum;
    };


    $scope.showInterval= function(start,end,ticker){
        st = start.split("-");
        ed = end.split("-");

        //voltando alguns periodos.



        var ajuste = parseInt(st[4]) % parseInt($scope.stock.periodLength);
        ajuste = parseInt(st[4])  - ajuste;

        startDate = new Date(st[0],st[1]-1,st[2],st[3],ajuste,0,0);
        realStartDate = new Date(st[0],st[1]-1,st[2],st[3],ajuste,0,0);
        //console.log(st,startDate);
        for(i = 0; i < 35; i++) {
            startDate.setTime(startDate.getTime()-(60000*$scope.stock.periodLength));

            if(startDate.getHours() < 9){
                startDate.setHours(17);
                startDate.setMinutes(30);
                startDate.setTime(startDate.getTime()-(86400000));
            }

            if(startDate.getDay() === 0 || startDate.getDay() === 6)
                i--;
        }

        var onth = "" + (startDate.getMonth()+1);
        var ate = "" + startDate.getDate();
        var ours = "" + startDate.getHours();
        var inutes = "" + startDate.getMinutes();
        
        st = [
            startDate.getFullYear(),
            ("00").substring(0, 2 - onth.length) + onth,
            ("00").substring(0, 2 - ate.length) + ate,
            ("00").substring(0, 2 - ours.length) + ours,
            ("00").substring(0, 2 - inutes.length) + inutes
        ];

        $scope.stock.start = st[0] + "-" + st[1] + "-" +st[2] + " " + st[3] + ":" + st[4];
        $scope.stock.end= ed[0] + "-" + ed[1] + "-" +ed[2] + " " + ed[3] + ":" + ed[4];

        $scope.stock.code = ticker;

        $scope.updateCharts(realStartDate/1000);

    };

    $scope.candleList = [];
    $scope.updateCharts = function(selectDate) {

        $window.document.title = $scope.stock.code + " - stockBot"
        candleList = [];
        debug = [];
        //console.log($scope.chart);


        searchStart = $scope.stock.start.replace(" ", "-")
            //.replace(":", "-")
            .replace(":", "-");
        searchEnd = $scope.stock.end.replace(" ", "-")
            //.replace(":", "-")
            .replace(":", "-");


        var url = "stock/"+$scope.stock.code+"/trades/"+searchStart +"/"+searchEnd+"/"+$scope.stock.periodLength+"/"+$scope.stock.maxPeriods;
        var candleList = [];

        $http.get(url).then(function(data){

            if(data.data.length > 0)
                $scope.firstCandle = data.data[0];

            data.data.forEach(function(element){
                var candle = new Candle(
                    element.start,
                    element.end,
                    element.min,
                    element.open,
                    element.close,
                    element.max,
                    element.quantity
                );
                candle.exchange = element.exchange;
                    candleList.push(candle);
                $scope.lastCandle = candle;
            });


            //console.log(candleList);
            $scope.candleChart = new CandleChart(candleList);

            $scope.candleChart.addIndicator("MME",indicatorService.MMEC,"line",{periods:9,color:"green"});
            $scope.candleChart.addIndicator("MME",indicatorService.MMEC,"line",{periods:21,color:"red"});
            $scope.candleChart.addIndicator("bollinger",indicatorService.bollinger,"area",{periods:20,color:"grey"});
            //$scope.candleChart.addIndicator("bollinger",indicatorService.bollinger,"area",{periods:10,color:"pink"});
            $scope.candleChart.addIndicator("debugBollingerPart",indicatorService.debugBollingerPart,"line",{periods:20,color:"orange"});
            $scope.candleChart.addIndicator("debug_tops",indicatorService.DEBUG_getTops,"points",{periods:0,color:"green",pointSize:3});
            $scope.candleChart.addIndicator("debug_bottoms",indicatorService.DEBUG_getBottoms,"points",{periods:0,color:"red",pointSize:3});

            indicatorService.findTrenchs(candleList);
            var resistencias = [];
            var suportes = [];
            indicatorService.trenchs.forEach(function(trench){

               if(trench.value > candleList[candleList.length-1].close) {
                   resistencias.push(trench);
               }
               else {
                   suportes.push(trench);
               }

            });
            resistencias = resistencias.sort(function(a,b){
                return a.value - b.value;
            });
            suportes = suportes.sort(function(a,b){
                return b.value - a.value;
            });
            while(resistencias.length > 2) resistencias.pop();
            while(suportes.length > 2) suportes.pop();
            suportes.forEach(function(trench){

                 $scope.candleChart.addIndicator("trench",indicatorService.drawLine,"line",{periods:trench.value,color:"#107E28"});

            });
            resistencias.forEach(function(trench){

                $scope.candleChart.addIndicator("trench",indicatorService.drawLine,"line",{periods:trench.value,color:"#9C150F"});

            });
            $scope.candleChart.update();



            $scope.volumeChart = new VolumeChart(candleList);
            $scope.volumeChart.addIndicator("volumeMMS",indicatorService.volumeMMS,"line",{periods:21,color:"red"});
            $scope.volumeChart.update();

            var tempIfr = indicatorService.IFR(candleList,2);
            var ifrData = [];
            tempIfr.forEach(function(ifr){ifrData.push(ifr[0]); });
            $scope.ifrChart = new LineChart(ifrData,"#AEB404");
            $scope.volumeChart.addIndicator("IFR_LOW",indicatorService.drawLine,"line",{periods:20,color:"green"});
            $scope.volumeChart.addIndicator("IFR_HIGH",indicatorService.drawLine,"line",{periods:80,color:"red"});
            $scope.ifrChart.update();

            var tempAD = indicatorService.accumDist(candleList);
            var adData = [];
            tempAD.forEach(function(ad){adData.push(ad[0]); });
            $scope.adChart = new LineChart(adData,"blue");
            $scope.adChart.update();

            var tempBW = indicatorService.bollingerWidth(candleList,20);
            var bwData = [];
            tempBW.forEach(function(bw){bwData.push(bw[0]); });
            $scope.bwChart = new LineChart(bwData,"grey");
            $scope.bwChart.update();



            $scope.candleList = candleList;


            //$scope.detectOpportunity();




            if(typeof selectDate !=='undefined') {

                var index = data.data.findIndex(function(element){
                    //console.log(element.timestamp === selectDate-3600,element.timestamp,selectDate-3600,selectDate);
                    return element.timestamp === selectDate-3600;
                });
                selected = {"row": index, "column": 1};
            }

        },function(data){

        });

        var brickList = [];
        url = "stock/"+$scope.stock.code+"/renko/"+$scope.renkoResolution;
        $http.get(url).then(function(data){



            data.data.forEach(function(element){
                var candle = new Candle(
                    element.e,
                    element.s,
                    Math.min(element.o,element.c),
                    element.o,
                    element.c,
                    Math.max(element.o,element.c),
                    0
                );
                //candle.exchange = element.exchange;
                brickList.push(candle);
                //$scope.lastCandle = candle;
            });



            $scope.renkoChart = new CandleChart(brickList);
            $scope.renkoChart.update();


        },function(data){});



    };


    $scope.detectOpportunity = function() {

        if(opportunityService.detectOpportunity($scope.candleList,true)) {
           var ifr = indicatorService.IFR($scope.candleList,2)[$scope.candleList.length-1][0];
           console.log(opportunityService.setStopAndTarget($scope.candleList[$scope.candleList.length-1],ifr));
        }

    };

    var wrappers = [];
    var selected;
    $scope.registerWrappers = function(chartWrapper,chart) {
        //console.log(chart)

        //console.log(chartWrapper,chart);
        if(!wrappers.some(function(wrapper){
                return wrapper.chart === chart;
            })){
            wrappers.push({
                chart: chart,
                wrapper: chartWrapper
            })
        }

        $scope.selectHandler(selected);
    };


    $scope.selectHandler = function(selectedItem) {
        //console.log(selectedItem);
        selected = selectedItem;
        if(typeof selectedItem === 'undefined') {
            wrappers.forEach(function(wrapper){
                wrapper.wrapper.getChart().setSelection([]);
            });
        }
        else {
            wrappers.forEach(function (wrapper) {
                wrapper.wrapper.getChart().setSelection([selectedItem]);
            });
        }
    };

    console.info("candleController loaded");


    $scope.testeNovo = function() {
        strategyTestService.bullOneTest($scope.stock.code,$scope.stock.periodLength,true);
    }



});
/**
 * Created by Ian on 28/12/2016.
 */
app.controller("mainController",function($scope,$http){







    console.info("mainController Loaded");
});
//# sourceMappingURL=app.js.map
