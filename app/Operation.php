<?php

namespace stockBot;

use Illuminate\Database\Eloquent\Model;

class Operation extends Model
{
    public $table = "operation";
    public $timestamps = false;

    public function stock(){
        return $this->belongsTo("stockBot\Stock","stock_id");
    }
}
