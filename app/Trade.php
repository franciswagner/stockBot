<?php

namespace stockBot;

use Illuminate\Database\Eloquent\Model;

class Trade extends Model
{
    public $table = "trade";
    public $timestamps = false;

    public function stock(){
        return $this->belongsTo("stockBot\Stock","stock_id");
    }
}
