<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class AddForeignKeysToTradeTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::table('trade', function(Blueprint $table)
		{
			$table->foreign('stock_id', 'fk_trade_stock')->references('id')->on('stock')->onUpdate('NO ACTION')->onDelete('NO ACTION');
		});
	}


	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::table('trade', function(Blueprint $table)
		{
			$table->dropForeign('fk_trade_stock');
		});
	}

}
