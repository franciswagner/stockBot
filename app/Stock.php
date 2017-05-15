<?php

namespace stockBot;

use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    public $table = "stock";
    public $timestamps = false;





    public function trades () {
        return $this->hasMany('stockBot\Trade','stock_id');
    }

    public function operations () {
        return $this->hasMany('stockBot\Operation','stock_id');
    }


    public function periods () {
        return $this->hasMany('stockBot\Period','stock_id');
    }

}
