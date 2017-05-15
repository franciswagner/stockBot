<?php

namespace stockBot\Http\Controllers;

use DateTime;
use Exception;
use stockBot\Stock;
use stockBot\Trade;

//use Illuminate\Http\Request;
//use League\Flysystem\Exception;

class CSVController extends Controller
{
    public function showDebugCSV() {



        ini_set('max_execution_time', 0);

        try {
            $filename = "debug_csv.csv";
            $handle = fopen($filename ,"r");
            $lineCount = count(file($filename ));

            $stockCode = (explode(" ",fgetcsv($handle,0,';')[0]))[1];
            fgetcsv($handle,0,';'); //pra tirar o cabeçalho extra
            dump($stockCode);


            $stock = Stock::where(["code" => $stockCode])->first();
            if(!$stock) {
                $stock = new Stock;
                $stock->code = $stockCode;
                $stock->save();

                echo "$stockCode created.<br \>";
            }

            $count = 0;
            $lastPers = 0;
            $trades = $stock->trades;

            $temp = array();
            $date = 0;
            foreach ($trades as $trade) {
                $date =  DateTime::createFromFormat('Y-m-d H:i:s', $trade->time);
                $temp[$date->getTimestamp()] = true;
                $lineCount--;
            }
            $trades = $temp;
            unset($temp);
            echo "$lineCount to add <br />";
            ob_flush();
            flush();

            while (($data = fgetcsv($handle,0,';')) !== FALSE) {
                //dump($data);
                $date = $data[0] . " " . $data[1];
                //dump($date);
                //dd($date);
                $date =  DateTime::createFromFormat('d/m/Y H:i', $date);

                //dump($date);

                //dump($date->getTimestamp(),$date->format('d/m/Y H:i'));

               // $trade = Trade::where(["time" => $date])->first();
                //dump($date->getTimestamp(),isset($trades[$date->getTimestamp()]));
                if(!isset($trades[$date->getTimestamp()])){
                    $trade = new Trade;
                    $trade->stock()->associate($stock);
                    $trade->time = $date;
                    $trade->open = $data[2];
                    $trade->max = $data[3];
                    $trade->min = $data[4];
                    $trade->close = $data[5];
                    $trade->quantity = $data[6];
                    //dd($data);
                    $trade->save();
                    unset($trade);


                    $pers = round($count / $lineCount,3) * 100;
                    //echo "$pers $count $lineCount<br \>";
                    if($pers != $lastPers) {
                        $lastPers = $pers;
                        echo "$lastPers <br \>";
                        ob_flush();
                        flush();
                    }
                    $count++;

                }

            }
            fclose($handle);
            ini_set('max_execution_time', 30);


        }catch(Exception $e) {
            ini_set('max_execution_time', 30);
            return response()->json([
                'error' => $e->getCode(),
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
