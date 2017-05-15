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