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