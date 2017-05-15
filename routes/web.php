<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('main.main');
});

Route::get('/view/{name}', function ($name) {
    if(View::exists($name)) {
        return view($name);
    }
    else {
        return response()->json([
            'error' => 404,
            'message' => 'Invalid view.'
        ], 404);
    }
})->name('getView');

Route::group(['prefix' => 'stock'],function() {
    Route::get('/', 'StockController@index')->name("stock.index");
    Route::get('/{stockCode}', 'StockController@show')->name('stock.show');
    Route::get('/{stockCode}/trades/{startTime}/{endTime}/{periodLength}/{maxPeriods}', 'TradeController@index')->name('stock.trades');
    Route::get('/{stockCode}/renko/{resolution}', 'TradeController@getRenkoData')->name('stock.renko');
    Route::post('/operation', 'OperationController@store')->name('operation.store');


});


Route::group(['prefix' => 'debug'],function() {
    Route::get('csv', 'CSVController@showDebugCSV')->name('debugCSV');
});







