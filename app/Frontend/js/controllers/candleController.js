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