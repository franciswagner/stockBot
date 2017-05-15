<?php
/**
 * Created by PhpStorm.
 * User: Ian
 * Date: 28/12/2016
 * Time: 22:39
 */
?>

<hr />
<md-input-container>
    <label>Código da ação</label>
    <input ng-model="stock.code">
</md-input-container>
<md-input-container>
    <label>Início</label>
    <input ng-model="stock.start">
</md-input-container>
<md-input-container>
    <label>Fim</label>
    <input ng-model="stock.end">
</md-input-container>
<md-input-container>
    <label>Tamanho do período (em minutos)</label>
    <input ng-model="stock.periodLength">
</md-input-container>
<md-input-container>
    <label>Máximo de Períodos</label>
    <input type='number' ng-model="stock.maxPeriods" ng-click="updateCharts()">
</md-input-container>
<md-button class="md-raised md-primary" ng-click ="updateCharts()" >Atualizar</md-button>
<md-button class="md-raised md-primary" ng-click ="detectOpportunity()" >Opportunity</md-button>
<md-button class="md-raised md-primary" ng-click ="selectedAnalysis()">Classificar Selecionado</md-button>
<md-button class="md-raised md-primary" ng-click ="getActualTendency()">Tendencia atual @{{ actualTendency }}</md-button>
<md-button class="md-raised md-primary" ng-click ="applyOnList()">Buscar Oportunidades @{{ ((resultList.length / stockWatchs.length)*100).toFixed(2) }}</md-button>
<md-button class="md-raised md-primary" ng-click ="testeNovo() ">Teste novo</md-button>
Mostrando de @{{ firstCandle.start  }} até @{{ lastCandle.end  }}




<div google-chart chart="candleChart" agc-on-ready="registerWrappers(chartWrapper,'candleChart')" agc-on-select ="selectHandler(selectedItem)" style="height:450px; width:100%;"></div>
<md-input-container>
    <label>Renko)</label>
    <input ng-model="renkoResolution">
</md-input-container>
<div google-chart chart="renkoChart" style="height:450px; width:100%;"></div>
<h5>Volume</h5>
<div google-chart chart="volumeChart" agc-on-ready="registerWrappers(chartWrapper,'volumeChart')" agc-on-select ="selectHandler(selectedItem)" style="height:75px; width:100%;"></div>
<h5>índice de Força Relativa</h5>
<div google-chart chart="ifrChart"    agc-on-ready="registerWrappers(chartWrapper,'ifrChart')"    agc-on-select ="selectHandler(selectedItem)" style="height:75px; width:100%;"></div>
<h5>Acumulação/Distribuição</h5>
<div google-chart chart="adChart"     agc-on-ready="registerWrappers(chartWrapper,'adChart')"     agc-on-select ="selectHandler(selectedItem)" style="height:75px; width:100%;"></div>
<h5>BollingerWidth</h5>
<div google-chart chart="bwChart"     agc-on-ready="registerWrappers(chartWrapper,'bwChart')"     agc-on-select ="selectHandler(selectedItem)" style="height:75px; width:100%;"></div>




<md-button class="md-raised md-primary" ng-click ="detectionTest()" >Teste de detecção para lista @{{ strategyTestService.testPer }} </md-button>
<style>
    .tableStrip {
        background-color: #EEEEEE;
    }
</style>

<table border="1">
    <thead style="font-weight: bold">
        <tr>
            <td></td>
            <td></td>
            <td ng-click="testTableSort('index')">#</td>
            <td>Ticker</td>
            <td ng-click="testTableSort('operationsNum')">Num. Ops. (@{{ stockWatcherAll.operationsNum }})</td>
            <td ng-click="testTableSort('first')">Primeira</td>
            <td ng-click="testTableSort('last')" >Ultima</td>
            <td ng-click="testTableSort('gain')">Ganho (@{{ stockWatcherAll.gain }})</td>
            <td ng-click="testTableSort('loss')">Perda (@{{ stockWatcherAll.loss}})</td>
            <td ng-click="testTableSort('gainP')">Ganho% (@{{ stockWatcherAll.gainP }})</td>
            <td ng-click="testTableSort('lossP')">Perda% (@{{ stockWatcherAll.lossP }})</td>
            <td ng-click="testTableSort('accGain')">Ganho Acu. (@{{ stockWatcherAll.accGain }})</td>
            <td ng-click="testTableSort('accLoss')">Perda Acu. (@{{ stockWatcherAll.accLoss }})</td>
            <td ng-click="testTableSort('accTotal')">Valorização Total (@{{ stockWatcherAll.accTotal }})</td>
        </tr>
    </thead>
    <tbody>
        <tr ng-repeat-start="stock in stockWatchs" ng-class="{tableStrip: $odd}">
            <td ng-click="showHide[stock.ticker] = !showHide[stock.ticker]">@{{ showHide[stock.ticker] ? '-' : '+'; }}</td>
            <td ng-click="detectionTest(stock.ticker )" >Test</td>
            <td>@{{ stock.index }}</td>
            <td>@{{ stock.ticker }}</td>
            <td>@{{ stock.operationsNum }}</td>
            <td>@{{ stock.first }}</td>
            <td>@{{ stock.last }}</td>
            <td>@{{ stock.gain }}</td>
            <td>@{{ stock.loss }}</td>
            <td>@{{ stock.gainP }}</td>
            <td>@{{ stock.lossP }}</td>
            <td>@{{ stock.accGain }}</td>
            <td>@{{ stock.accLoss }}</td>
            <td>@{{ stock.accTotal }}</td>
        </tr><tr ng-show="showHide[stock.ticker]">
            <td colspan="14">
                <ol>
                <li ng-repeat-start="operation in stock.operations" ng-repeat-end>
                    <spam ng-click="showInterval(operation.start,operation.end,operation.ticker)">
                        <spam ng-if ="operation.result" style="color:green">GAIN</spam>
                        <spam ng-if ="!operation.result" style="color:red">LOSS</spam>
                        <spam ng-if ="operation.limitDate">(date Limit)</spam>
                        :
                    </spam>
                    Compra(@{{ operation.start }}): @{{ operation.price }} - Venda(@{{ operation.end }}): @{{ operation.result ? operation.target : operation.stop  }} - @{{ operation.result ? "stop: "+ operation.stop : "target: "+ operation.target  }}
                    @{{ operation.limitDate ? "- oTarget: " + operation.oldTarget + " - oStop: " + operation.oldStop : "" }}
                        (<spam ng-if ="operation.result" style="color:green">@{{ ((operation.target / operation.price)-1)*100  }}</spam>
                        <spam ng-if ="!operation.result" style="color:red">@{{ (1-(operation.price  / operation.stop))*100  }}</spam>)



                <li />
                </ol>
            </td>
        </tr>
        <tr ng-repeat-end></tr>
    </tbody>
</table>
