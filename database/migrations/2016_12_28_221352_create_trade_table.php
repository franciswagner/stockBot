<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreateTradeTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('trade', function(Blueprint $table)
		{
			$table->integer('stock_id');
			$table->timestamp('time')->default(DB::raw('CURRENT_TIMESTAMP'));
			$table->decimal('open', 15);
			$table->decimal('min', 15);
			$table->decimal('max', 15);
			$table->decimal('close', 15);
			$table->integer('quanitiy');
			$table->primary(['stock_id','time']);
		});
	}


	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::drop('trade');
	}

}
