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


