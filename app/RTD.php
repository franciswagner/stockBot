<?php

namespace stockBot;

use Illuminate\Database\Eloquent\Model;

class RTD extends Model
{

    public $table = "rtd";
    public $timestamps = false;

    public function stock(){
        return $this->belongsTo("stockBot\Stock","stock_id");
    }

}
