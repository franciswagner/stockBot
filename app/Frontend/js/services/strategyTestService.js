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