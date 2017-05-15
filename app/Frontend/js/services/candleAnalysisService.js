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