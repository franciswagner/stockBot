<?php

namespace stockBot\Http\Controllers;

use stockBot\Stock;
use Illuminate\Http\Request;

class StockController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return Stock::all();
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  \stockBot\Stock  $stock
     * @return \Illuminate\Http\Response
     */
    public function show($stockCode)
    {
        $needle = strtoupper($stockCode);
        $stock = Stock::where(["code" => $needle])->first();
        if($stock) {
            return $stock;
        }
        else {
            return response()->json([
                'error' => 404,
                'message' => "Not Found"
            ], 404);
        }

    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \stockBot\Stock  $stock
     * @return \Illuminate\Http\Response
     */
    public function edit(Stock $stock)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \stockBot\Stock  $stock
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Stock $stock)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \stockBot\Stock  $stock
     * @return \Illuminate\Http\Response
     */
    public function destroy(Stock $stock)
    {
        //
    }
}
