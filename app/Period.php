<?php

namespace stockBot;

use Illuminate\Database\Eloquent\Model;

class Period extends Model
{
    public $table = "period";
    public $timestamps = false;

    public function stock(){
        return $this->belongsTo("stockBot\Stock","stock_id");
    }

}
