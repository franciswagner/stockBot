<?php
/**
 * Created by PhpStorm.
 * User: Ian
 * Date: 28/12/2016
 * Time: 22:39
 */
?>
<!DOCTYPE html>
<html lang="en" ng-app="stockBot">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">
    <title>StockBot</title>


   <!-- <link href="../css/bootstrap.css" rel="stylesheet">-->
    <link rel="stylesheet" href="../css/nv.d3.css">
    <link href="../css/angular-material.css" rel="stylesheet" type="text/css">



</head>
<body ng-controller="mainController">



<md-content class="md-padding">
    <a ui-sref="candles">Candles</a>

    <hr />
    <div ui-view></div>
</md-content>




<!--
<script src="../js/angular.js"></script>
<script src="../js/angular-ui-router.js"></script>
-->
<script src="../js/lib.js"></script>
<script src="../js/app.js"></script>

</body>
</html>

