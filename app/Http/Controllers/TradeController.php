<?php

namespace stockBot\Http\Controllers;

use DateInterval;
use DateTime;
use DateTimeZone;
use Psy\Exception\ErrorException;
use stockBot\Cache;
use stockBot\Operation;
use stockBot\Period;
use stockBot\RTD;
use stockBot\Stock;
use stockBot\Trade;
use Illuminate\Http\Request;

class TradeController extends Controller
{

    private function getTradesFromGoogle($stockCode,$startTime,$endTime,$periodLength,$maxPeriods,$historic = "120d") {





        $timezone = new DateTimeZone('America/Sao_Paulo');

        $startT = DateTime::createFromFormat('Y-m-d-H-i', $startTime);
        $startT->setTimeZone($timezone);
       // dump( $startT->getTimestamp());
        $startT = $startT->getTimestamp() - timezone_offset_get($timezone, $startT);
        //$startT-=900;
        //dump($startT);
        $endT = DateTime::createFromFormat('Y-m-d-H-i', $endTime);
        $endT->setTimeZone($timezone);
        $endT = $endT->getTimestamp() - timezone_offset_get($timezone, $endT);
        //$endT-=900;


        //TODO talvez a geração de cache seja mais eficiente se fixar uma data q pegue todos os dados daquele ticker
        //e tamanho de periodo. Pq qlqr data vai pegar msm...
        //dai é soh filtrar os resultados de acordo com o cache ou com os dados recebidos.



        //verificar se existe cache
        $cache = new Cache();
        $cacheKey = 'stockBot_' . $stockCode . '_' . $periodLength . '_' . $maxPeriods . '_'  . $startT .  '_' . $endT;

        $data =  $cache->read($cacheKey);

        //$data = null;

        if($data != null) { // existe cache.
            $data = base64_decode($data);
            $data = json_decode($data);
            foreach ($data as &$period) {

                $period->exchange = "CACHE " . $data[0]->cacheExpirationTimeStamp ;
            }
            return $data;
        }
        //////////


        $period = 60 * $periodLength;


        //$url = "http://www.google.com/finance/getprices?x=BVMF&i=".$period."&p=3d&f=d,o,h,l,c,v&df=cpct&q=".$stockCode;
        $url = "www.google.com/finance/getprices?q=".$stockCode."&x=BVMF&i=".$period."&p=".$historic."&f=d,c,v,o,h,l&df=cpct&auto=0&ei=Ef6XUYDfCqSTiAKEMg";
        //return $url;
        //dd($url);



        $ch = curl_init();
        //$ip = '127.0.0.1';
// informar URL e outras funções ao CURL
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        //curl_setopt( $ch, CURLOPT_HTTPHEADER, array("REMOTE_ADDR: $ip", "HTTP_X_FORWARDED_FOR: $ip"));
        //curl_setopt($ch,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
// Acessar a URL e retornar a saída
        $output = curl_exec($ch);
// liberar
        curl_close($ch);


// Substituir ‘Google’ por ‘PHP Curl’
        //$output = str_replace("Google", "PHP Curl", $output);
// Imprimir a saída
        //echo $output;
        try {
            $data = explode("\n", $output);




            //return $data;
            array_pop($data);
            //remover cabeçalho
            $exchange = array_shift($data);
            $exchange = explode("%3D", $exchange);
            $exchange = $exchange[1];


            $marketOpenMinute = explode("=", array_shift($data))[1];
            $marketCloseMinute = explode("=", array_shift($data))[1];
            array_shift($data); //intervalo, ignorar pq é 60 * periodLength;
            array_shift($data); //colunas, ignorar.
            array_shift($data); //campo data. ignorar
            $timezoneOffset = explode("=", array_shift($data))[1];
        }catch(\ErrorException $e) {

            $error = new \stdClass();
            $error->code = $e->getCode() === 403 ? 403 : 404;
            $error->message = $e->getCode() === 403 ? "Captcha" : "Not Found";
            $error->url = $url;

            return $error;
        }

        $trades = array();
        $lastTimestamp = 0;
        foreach($data as $line) {
            if($maxPeriods > 0 && count($trades) == $maxPeriods)
                break;

            $lineData = explode(",",$line);
            if(str_contains($lineData[0],"a")) {
                $lastTimestamp = str_replace("a","",$lineData[0]);
                continue;
            }


            $period = new \stdClass();

            $period->start = new DateTime();
            $period->start->setTimestamp(($lastTimestamp + ($lineData[0]-1)*(60 * $periodLength)));
            $period->start->setTimeZone($timezone );


            //se a data não estiver entre as duas informadas, continua sem incluir

            $timestamp = $period->start->getTimestamp();

            if($timestamp < $startT)
                continue;
            if($timestamp > $endT)
                continue;


            $period->start = $period->start->format('Y-m-d H:i');
            $period->timestamp = $timestamp  - 3600;


            $period->end = new DateTime();
            $period->end->setTimestamp((($lastTimestamp + (($lineData[0]-1)*(60 * $periodLength)))+(60 * $periodLength)));
            $period->end->setTimeZone($timezone );

            $period->end = $period->end->format('Y-m-d H:i');

            $period->close =  (float)$lineData[1];
            $period->max =  (float)$lineData[2];
            $period->min =  (float)$lineData[3];
            $period->open =  (float)$lineData[4];
            $period->quantity =  (float)$lineData[5];
            $period->exchange = $exchange;
            //$period->DEBUG_URL = $url;

            $trades[] = $period;
        }

        //armazenar em cache os dados do google, e expirar este cache a cada 10 min.
        //todo: Na verdade, o cache deve espirar no inicio previsto do próximo periodo.

    if(count($trades) == 0)
        return $trades;



        //diferença em minutos da timestamp atual pra timestamp de encerramento do ultimo periodo encontrado + 1;

        $actualT = new DateTime();

        //$actualT->setTimeZone($timezone);
        $actualT = $actualT->getTimestamp();
        $actualT -= $actualT % 60;

        $expirationT =  end($trades)->timestamp + ((60 * $periodLength)*2) + 3600;

        $trades[0]->cacheExpirationTimeStamp = $expirationT;
        $trades[0]->cacheExpirationTime = ($expirationT - $actualT)/60;
        $trades[0]->cacheExpirationTime = $trades[0]->cacheExpirationTime > 0 ? $trades[0]->cacheExpirationTime : 5;
        //$trades[0]->realCacheExpirationTime =  ($expirationT - $actualT)/60;
        $trades[0]->expirationT =  $expirationT;
        $trades[0]->lastEnd =  end($trades)->end;
        $trades[0]->actualT =  $actualT;


        $cacheData = json_encode($trades);
        $cacheData = base64_encode($cacheData);

        $cache->save($cacheKey, $cacheData, $trades[0]->cacheExpirationTime . ' minutes');

        //dd($cacheData);

        return $trades;




    }


    private function getTradesFromRTD($stockCode,$startTime,$endTime,$periodLength,$maxPeriods) {

        $start = DateTime::createFromFormat('Y-m-d-H-i', $startTime);
        $end = DateTime::createFromFormat('Y-m-d-H-i', $endTime);

        $stock = Stock::where("ticker",$stockCode)->first();
        $periods = RTD::
            where("stock_id",$stock->id)->
            //where("periodLength",$periodLength)->
            where("time",">=",$start)->
            where("time","<=",$end);

        $periods = $periods->orderBy("neg","asc")->get();

        if(!count($periods))
            return [];


        $results = array();
        $period = $periods->first();
        $periods->shift();

        //2017-01-23 14:47:41
        $currentTime = DateTime::createFromFormat('Y-m-d H:i:s', $period->time);
        $currentTime->setTimestamp( $currentTime->getTimestamp() - ($currentTime->getTimestamp() % 60) );


        $lastTime = $currentTime;//DateTime::createFromFormat('Y-m-d H:i', $period->time);
        $lastVolume = $period->volt;

        $new = new \stdClass();
        $new->start = $currentTime->format("Y-m-d H:i");
        //dd( $period->time,$new->start);

        $new->timestamp = $currentTime->getTimestamp();
        //$currentTime->setTimestamp($currentTime->getTimestamp()+($periodLength*60));

        //$new->end =$currentTime->format("Y-m-d H:i");
        $new->close = (float)$period->fec;
        $new->max = (float)$period->ult;
        $new->min = (float)$period->ult;
        $new->open = (float)$period->ult;
        $new->quantity = 0;//(int)$period->volf *10;
        $new->exchange = "RTD";
        $new->complete = false;
        $new->mont = 1;

        $periods->shift();


        $roundTimestamp = $new->timestamp - ($new->timestamp % (60 * $periodLength));
        foreach($periods as $key => $period) {


            $currentTime = DateTime::createFromFormat('Y-m-d H:i:s', $period->time);
            $currentTime->setTimestamp( $currentTime->getTimestamp() - ($currentTime->getTimestamp() % 60) );
            $realCurrentTime = $currentTime;

            if($currentTime->getTimestamp() >= $roundTimestamp + 60 * $periodLength) {
                //hora de mudar
                //encerrar
                $new->close = (float)$period->fec;
                if(isset($periods[$key-1]))
                    $new->close = (float)$periods[$key-1]->fec;

                $new->complete = true;
                $results[] = $new;
                //ajustar o tempo de inicio, para q n comece em minutos que não são multiplos do tamanho do periodo
                $currentLength = $currentTime->getTimestamp() % (60 * $periodLength);
                if($currentLength > 0){
                    $currentTime->setTimestamp($currentTime->getTimestamp() - $currentLength);
                }
                //começar o novo.
                $new = new \stdClass();
                $new->start = $currentTime->format("Y-m-d H:i");
                $new->timestamp = $currentTime->getTimestamp();
                $roundTimestamp = $new->timestamp;
                //$new->close = (float)$period->ult;
                $new->max = (float)$period->ult;
                $new->min = (float)$period->ult;
                $new->open = (float)$period->fec;
                $new->quantity = 0;//(int)$period->quant;
                $new->exchange = "RTD";
                $new->mont = 0;
                $new->startLength = $currentLength;
                $new->complete = false;
                $lastVolume = $period->volt;
           }
           $new->close = (float)$period->fec;
           $new->end = $realCurrentTime->format("Y-m-d H:i");
           $new->max = $new->max  < (float)$period->ult ? (float)$period->ult : $new->max;
           $new->min = $new->min  > (float)$period->ult ? (float)$period->ult : $new->min;
           //$new->quantity += (int)$period->quant;
           $new->quantity = ($period->volt - $lastVolume); //*1000;
           $new->mont++;

       }
       if(!$new->complete) {
           $results[] = $new;
       }

       //die();
       return $results;
   }

   private function getTradesFromDB($stockCode,$startTime,$endTime,$periodLength,$maxPeriods){



       $start = DateTime::createFromFormat('Y-m-d-H-i', $startTime);
       $end = DateTime::createFromFormat('Y-m-d-H-i', $endTime);


       $startT = $start->getTimestamp();
       $endT = $end->getTimestamp();

       $newPeriodLength = $periodLength * 60;

       $stock = Stock::where("ticker",$stockCode)->first();
       $periods = Period::
       where("stock_id",$stock->id)->
       where("periodLength",$newPeriodLength)->
       where("timestamp",">=",$startT)->
       where("timestamp","<=",$endT);

       if($maxPeriods > 0 ) {
           $periods = $periods->take($maxPeriods);
       }

       $periods = $periods->orderBy("timestamp","asc")->get();

       $results = array();
       foreach($periods as $period) {
           $period->time = new DateTime();
           $period->time->setTimestamp($period->timestamp);
           $period->time = $period->time->format('Y-m-d H:i:s');

           $currentTime = DateTime::createFromFormat('Y-m-d H:i:s', $period->time);

           $new = new \stdClass();
           $new->start = $currentTime->format("Y-m-d H:i");

           $new->timestamp = $currentTime->getTimestamp();
           $currentTime->setTimestamp($currentTime->getTimestamp()+($newPeriodLength));

           $new->end =$currentTime->format("Y-m-d H:i");
           $new->close = (float)$period->close;
           $new->max = (float)$period->high;
           $new->min = (float)$period->low;
           $new->open = (float)$period->open;
           $new->quantity = (int)$period->volume;
           $new->exchange = "DB";
           $new->complete = true;

           $results[] = $new;
       }

       return $results;

   }



   /**
    * Display a listing of the resource.
    *
    * @param $stockCode
    * @param $periodLength
    * @param $maxPeriods
    * @return \Illuminate\Http\Response
    */
    public function index($stockCode,$startTime,$endTime,$periodLength,$maxPeriods)
    {


        $date = new DateTime();
        $upperStockCode = strtoupper($stockCode);
        //return $this->getTradesFromRTD($stockCode,$startTime,$endTime,$periodLength,$maxPeriods);
        //return $this->getTradesFromGoogle($upperStockCode,$startTime,$endTime,$periodLength,$maxPeriods);

        //verificar se o ticker existe.
        $stock = Stock::where("ticker",$upperStockCode)->first();
        $currDate= ((int)$date->format("H"));
        if( $currDate < 11 || $currDate >= 20 || !$stock) { //20 GMT. Utilização do backup interno.

            return $this->getTradesFromGoogle($upperStockCode,$startTime,$endTime,$periodLength,$maxPeriods);

            $updateNeeded = false;

            if (!$stock) {
                $stock = new Stock();
                $stock->ticker = $upperStockCode;
                $stock->save();
                $updateNeeded = 1;
            }

            $periodLengths = array(1, 5, 10, 15, 30, 60, 60*24);
            //verificar ultimo backup do maior período.
            $p60 = Period::where("stock_id", $stock->id)->where("periodLength", end($periodLengths))->orderBy("time", "desc")->get();


            //se tiver vazio ou não for do dia de hj,  baixar os dados de 1,5,19,15,30 e 60 min e salvar.

            if (!count($p60)) {
                $updateNeeded = true;

            } else {

                $lastTime = DateTime::createFromFormat('Y-m-d H:i:s', $p60[0]->time);
                dd($lastTime,$date,__LINE__);


                $interval = $date->diff($lastTime);
                //dd($interval);
                if ($interval->d > 0) {
                    $updateNeeded = true;

                }
            }



            if ($updateNeeded) {

                set_time_limit(0);
                //dd("vazio");

                foreach ($periodLengths as $pl) {

                    $periods = $this->getTradesFromGoogle(
                        $upperStockCode,
                        "2000-01-01-00-00",
                        "2050-01-01-00-00",
                        $pl,
                        0
                    );

                    $savedPeriods = Period::where("stock_id", $stock->id)->where("periodLength", $pl)->orderBy("time", "desc")->get();
                    $temp = array();
                    foreach ($savedPeriods as $savedPeriod) {
                        $timestamp = DateTime::createFromFormat('Y-m-d H:i:s', $savedPeriod->time);
                        $timestamp = $timestamp->getTimestamp();
                        $temp[$timestamp] = true;
                    }
                    $savedPeriods = $temp;

                    if(!is_array($periods)){
                        return  (array)$periods;
                    }

                    //dd($periods);
                    foreach ($periods as $period) {

                        //checa se já existe.
                        if (isset($savedPeriods[$period->timestamp]))
                            continue;

                        $newPeriod = new Period();
                        $newPeriod->time = new DateTime();
                        $newPeriod->time->setTimestamp($period->timestamp);
                        $newPeriod->periodLength = $pl;
                        $newPeriod->open = $period->open;
                        $newPeriod->close = $period->close;
                        $newPeriod->min = $period->min;
                        $newPeriod->max = $period->max;
                        $newPeriod->volume = $period->quantity;
                        $newPeriod->stock_id = $stock->id;
                        dd($newPeriod->save());

                    }

                }
                set_time_limit(30);
            }
            return $this->getTradesFromDB($upperStockCode, $startTime, $endTime, $periodLength, $maxPeriods);
        }
        else { //baixar dados do google.

            $periods = $this->getTradesFromGoogle($upperStockCode,$startTime,$endTime,$periodLength,$maxPeriods);
            if(!is_array($periods)) return "erro";

           foreach($periods as &$period) $period->complete = true;

            if(count($periods)) {
                $lastPeriod = end($periods);
                $lastTime = DateTime::createFromFormat('Y-m-d H:i', $lastPeriod->end);
                $lastTime = $lastTime->format("Y-m-d-H-i");
            }
            else {
                $lastTime = $startTime;
            }

            //TODO: incluir dados rtd do final do dia para atualizar backup do db.
            $dbPeriods = [];/*($this->getTradesFromDB($upperStockCode,$lastTime,$endTime,$periodLength,$maxPeriods);
            if(!is_array($dbPeriods)) return "erro";

            foreach($dbPeriods as &$period) $period->complete = true;

            if(count($dbPeriods)) {
                $lastPeriod = end($dbPeriods);
                $lastTime = DateTime::createFromFormat('Y-m-d H:i', $lastPeriod->end);
                $lastTime = $lastTime->format("Y-m-d-H-i");
            }
            else {
                $lastTime = $startTime;
            }*/

            $rtd = $this->getTradesFromRTD($upperStockCode,$lastTime,$endTime,$periodLength,$maxPeriods);

            //return array_merge($periods,$dbPeriods);
            return array_merge($periods,$dbPeriods,$rtd);


           return $periods;
        }

    }

    public function getRenkoData($stockCode,$resolution){



        $bricks = array();
        $upperTicker = strtoupper($stockCode);
        $stock = Stock::where("ticker",$upperTicker)->first();
       // dd($stock);
        $decimalResolution = $resolution / 100;

        if($stock) {


            $priceData = RTD::where("stock_id",$stock->id)->orderBy("time","asc")->get();

            $lastClose = $priceData[0];
            $lastClose->ult -= ($lastClose->ult*100 % $resolution)/100;



            $lastBrick = new \stdClass();
            $lastBrick->t =
            $lastBrick->b =  $lastClose->ult;


            foreach($priceData as $price){

                $price->ult = (float) $price->ult;
                $price->ult -= ($price->ult*100 % $resolution)/100;


                if($price->ult >= $lastBrick->t + $decimalResolution) { //positivo.

                    $newBrick = new \stdClass();
                    $newBrick->o = $lastBrick->t;
                    $newBrick->c = $price->ult;
                    $newBrick->e = $price->time;
                    $newBrick->s = "0";
                    $newBrick->oT = 0;
                    $newBrick->cT = (DateTime::createFromFormat('Y-m-d H:i:s',  $price->time))->getTimestamp();


                    /*$newBrick->o = sprintf("%.2f",$newBrick->o);
                    $newBrick->c = sprintf("%.2f",$newBrick->c);*/


                    $newBricks = [];
                    $diff = round(abs($newBrick->o - $newBrick->c),2);
                    if($diff > $decimalResolution) {



                        for($i = 0; $i < $diff / $decimalResolution ; $i++) {
                            $correctBrick = new \stdClass();
                            $correctBrick->i = $i;
                            $correctBrick->diff = $diff;
                            $correctBrick->oo = $newBrick->o;
                            $correctBrick->oc = $newBrick->c;
                            $correctBrick->o = $newBrick->o + ($i * $decimalResolution);
                            $correctBrick->c = $newBrick->o + ($i * $decimalResolution) + $decimalResolution;
                            $correctBrick->e = $newBrick->e;
                            $correctBrick->s = $newBrick->s;
                            $correctBrick->oT = $newBrick->oT;
                            $correctBrick->cT = $newBrick->cT;
                            $newBricks [] = $correctBrick;
                        }


/*
                        $err = new \stdClass();
                        $err->c = $err->o = $diff;
                        $newBricks [] = $err;*/
                    }
                    else $newBricks[] = $newBrick;


                    foreach($newBricks as $newBrick) {
                        $bricks[] = $newBrick;
                        $lastBrick = $newBrick;
                        $lastBrick->t = $newBrick->c;
                        $lastBrick->b = $newBrick->o;
                    }
                }
                else if($price->ult <= $lastBrick->b - $decimalResolution) { //positivo.

                    $newBrick = new \stdClass();
                    $newBrick->o = $lastBrick->b;
                    $newBrick->c = $price->ult;
                    $newBrick->e = $price->time;
                    $newBrick->s = "0";
                    $newBrick->oT = 0;
                    $newBrick->cT = (DateTime::createFromFormat('Y-m-d H:i:s',  $price->time))->getTimestamp();

                    $newBricks = [];
                    $diff = round(abs($newBrick->o - $newBrick->c),2);
                    if($diff > $decimalResolution) {
                        for($i = 0; $i < $diff / $decimalResolution ; $i++) {
                            $correctBrick = new \stdClass();
                            $correctBrick->i = $i;
                            $correctBrick->diff = $diff;
                            $correctBrick->oo = $newBrick->o;
                            $correctBrick->oc = $newBrick->c;
                            $correctBrick->o = $newBrick->o - ($i * $decimalResolution);
                            $correctBrick->c = $newBrick->o - ($i * $decimalResolution) - $decimalResolution;
                            $correctBrick->e = $newBrick->e;
                            $correctBrick->s = $newBrick->s;
                            $correctBrick->oT = $newBrick->oT;
                            $correctBrick->cT = $newBrick->cT;
                            $newBricks [] = $correctBrick;
                        }


                    }
                    else $newBricks[] = $newBrick;


                    foreach($newBricks as $newBrick) {
                        $bricks[] = $newBrick;
                        $lastBrick = $newBrick;
                        $lastBrick->t = $newBrick->o;
                        $lastBrick->b = $newBrick->c;
                    }
                }
            }

        }

        foreach($bricks as $key => &$brick){
            $brick->n = $key;

            unset($brick->t);
            unset($brick->b);
        }

        return $bricks;
    }


}
