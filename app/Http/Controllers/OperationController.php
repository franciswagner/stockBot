<?php

namespace stockBot\Http\Controllers;

use DateTime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Input;
use stockBot\Operation;
use stockBot\Stock;

class OperationController extends Controller
{

    /**
     *
     */
    public function store() {


        //dd(Input::all());

        $upperTicker = strtoupper(Input::get("ticker"));

        $stock = Stock::where("ticker",$upperTicker)->first();



        if($stock) {


            $operation = new Operation();
            $operation->stock_id = $stock->id;
            $operation->time = new DateTime();
            $operation->time->setTimestamp(Input::get("timestamp"));
            $operation->price = (float)Input::get("price");
            $operation->stop = (float)Input::get("stop");
            $operation->target = (float)Input::get("target");
            $operation->type = Input::get("type");
            $operation->periodLength = Input::get("periodLength");
            $operation->save();
            return $operation->id;

        }
        return 0;


    }

}
