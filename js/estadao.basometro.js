﻿/*!
 * Basômetro
 * Authors: http://github.com/tcha-tcho, estadaodados team.
 * http://estadaodados.com/html/basometro
 *
 * GPL Version 3 licenses.
 * http://www.gnu.org/licenses/gpl.html
*/

var primeira_iteracao = true;
var status_dilma_1_camara = false;
var status_dilma_1_senado = false;
var status_lula_1_camara = false;
var status_lula_1_senado = true;
var status_lula_2_camara = false;
var status_lula_2_senado = true;
var jsonURLBase = "https://s3-sa-east-1.amazonaws.com/estadaodados/basometro/";

window.DadosGerais={
	"dilma":{"câmara": {1: {}}, "senado": {1: {}}},
	"lula":{"câmara": {1:{}, 2:{}}, "senado": {1:{},2:{}}}
}

window.ReadyJson={
	"dilma":{"camara": {1: false }, "senado": {1: false}},
	"lula":{"camara": {1: false, 2: false}, "senado": {1: true, 2: true}}
}

var meses = [,,"mar",,,"jun",,,"set"];//intermediarios na legenda
var altura = 450, largura = 765; // do canvas
var ios = /(iPad|iPhone)/i.test(navigator.userAgent)
var complemento_camara = "http://www2.camara.gov.br/deputados/pesquisa/ws_layouts_deputados_fotoBiograf?id="
var inicio = false,
	fim = false,
	d,//dados e grupo que contem os pontos
	g,
	casa = "câmara",
	governo = "Dilma",
	legislatura = "1",
	first_time = true,
	datas_sorted = [],
	votacoes = [],
	votacoes_totais,
	antigas_votacoes_totais,
	participantes = [],
	votacoes_ids = [],
	participantes = {},
	votantes = {},
	votantes_sorted = [],
	partidos = [],
	votos = [],
	passos = 7,
	filtros = {},
	filtrar_bancada = false,
	filtros_votacoes = [],
	filtrar_votacoes = false,
	porcentagem,
	enter_frame = 0,
	tip_path,
	item_selected = false,
	media_por_votacao = {},
	media_da_votacao = {},
	politicos_hints = [],
	votacoes_hints = [],
	visualizacao = "por_bancadas_partidárias",
	is_fim = false,
	inicio_left = 0,
	play_interval,
	tocando = false,
	primeiro_toque = true,
  	bolinha_camara = 3, // do canvas
	bolinha_senado = 5; // do canvas

$.ui.autocomplete.prototype._renderItem = function( ul, item){
  var term = this.term.split(' ').join('|');
  var re = new RegExp("(" + term + ")", "gi") ;
  var t = item.label.replace(re,"<b>$1</b>");
  return $( "<li></li>" )
     .data( "item.autocomplete", item )
     .append( "<a>" + t + "</a>" )
     .appendTo( ul );
};

this.tooltip = function(el){	
	xOffset = 40
	yOffset = 0		
	el.unbind("hover").hover(function(e){
		$(this).addClass("hover")
		$("body").append("<p id='tooltip'>"+ $(this).attr("title") +"</p>")
		$("#tooltip")
			.css("top",(e.pageY - xOffset) + "px")
			.css("left",(e.pageX + yOffset) + "px")
			.show()
    },
	function(){
		$("#tooltip").remove();
		$(this).removeClass("hover")
    })
	el.unbind("mousemove").mousemove(function(e){
		$("#tooltip")
			.css("top",(e.pageY - xOffset) + "px")
			.css("left",(e.pageX + yOffset) + "px")
	})
}

function rebuild(){
	datas_sorted = [],
	votacoes = [],
	participantes = [],
	votacoes_ids = [],
	participantes = {},
	votantes = {},
	votantes_sorted = [],
	partidos = [],
	votos = [],
	filtros = {},
	enter_frame = 0,
	item_selected = false,
	media_por_votacao = {},
	media_da_votacao = {},
	is_fim = false,
	inicio_left = 0,
	$(".evento").remove();
	$(".evento_tag").remove();
	g.children = [];
	esconder_ficha();
	if (tocando) $("#tocar_votacao").click();

	politicos_hints = [];
	votacoes_hints = [];
}

function main(governo,legislatura,casa){
	governo = governo.toString().toLowerCase()
    legislatura = legislatura.toString().toLowerCase()
	casa = casa.toString().toLowerCase()
	$("#mpl"+(ios?"":"_ios")).hide()
	$("#como_usar").click(function(){
		$(this).fadeOut()
	})
	if ($.browser.msie && $.browser.version < 9 ) {
		alert("Atualize o Internet Explorer para a versão 9 ou superior; ou abra o Basômetro em outro navegador, como Chrome ou Firefox.")
	}
	if(!primeira_iteracao){
        var dld_status = status_download_json(governo,legislatura,casa)
        while (!dld_status){
            setTimeout(function(){},10000)
            dld_status = status_download_json(governo, legislatura, casa)
        }
        d = retorna_dados(governo,legislatura,casa)
	} else {
        primeira_iteracao = false
    }
	if (!d) {
		alert ('Dados não disponíves ou inacessíveis para este governo.')
	} else {
		papel()
		navegacao()
		mudar_visualizacao()
	}
}

/* Isso está muito feio!! Tem que fazer com um "dicionário" e/ou "mapa" */
function retorna_dados(governo,legislatura,casa) {
    if (governo == "lula" && legislatura == "1" && casa == "camara") {
        return DadosGerais["lula"]["câmara"][1]
    } else if (governo == "lula" && legislatura == "2" && casa == "camara") {
        return DadosGerais["lula"]["câmara"][2]
    } else if (governo == "dilma" && legislatura == "1" && casa == "camara") {
        return DadosGerais["dilma"]["câmara"][1]
    } else if (governo == "dilma" && legislatura == "1" && casa == "senado") {
        return DadosGerais["dilma"]["senado"][1]
    }
    return null
}

/* Isso está muito feio!! Tem que fazer com um "dicionário" e/ou "mapa" */
function status_download_json(governo,legislatura,casa) {
    if (governo == "lula" && legislatura == "1" && casa == "camara") {
        return status_lula_1_camara
    } else if (governo == "lula" && legislatura == "2" && casa == "camara") {
        return status_lula_2_camara
    } else if (governo == "dilma" && legislatura == "1" && casa == "camara") {
        return status_dilma_1_camara
    } else if (governo == "dilma" && legislatura == "1" && casa == "senado") {
        return status_dilma_1_senado
    } else if (governo == "lula" && casa == "senado") {
        return true
    }
    return false
}

function papel(){

	if (first_time) {
		paper.install(window)
		paper.setup('grafico')
		view.viewSize = new Size(largura, altura+10)
		view.onFrame = onFrame
		var tool = new Tool()
		tool.onMouseDown = onMouseDown
	}

    governo=governo.toString().toLowerCase()
    legislatura = legislatura.toString().toLowerCase()
	casa = casa.toString().toLowerCase()

    g = new Group();
    // g.position.y = 5;
    //var lista_politicos_local = politicos_json[governo][casa][legislatura]
    var lista_politicos_local = d.politicos
    for(politico in lista_politicos_local){
        lista_politicos_local[politico].ID_POLITICO = politico
        var circulo = new Path.Circle([380,5], ((casa=="câmara")?bolinha_camara:bolinha_senado))
            circulo.fillColor = 'red', circulo.fillColor.alpha = 0.7
            circulo.name = "id"+lista_politicos_local[politico].ID
            circulo.partido = lista_politicos_local[politico].PARTIDO
            circulo.politico = politico
            circulo.b_rur = (lista_politicos_local[politico].B_RUR?"RURALISTAS":false)
            circulo.b_ev = (lista_politicos_local[politico].B_EV?"EVANGÉLICOS":false)
            circulo.b_amb = (lista_politicos_local[politico].B_AMB?"AMBIENTALISTAS":false)
            circulo.uf = lista_politicos_local[politico].UF
            circulo.mandato = lista_politicos_local[politico].ANO_MANDATO
            circulo.foto = (lista_politicos_local[politico].URL_FOTO || lista_politicos_local[politico].ARQUIVO_FOTO)
            circulo.votos = [0,0,0,0,0,0,0];//o ultimo são os votos com o governo
        g.addChild(circulo)
	}

	tip_path = new Path();
	tip_path.strokeColor = 'white';
	tip_path._index = 1000;

	for (votacao in d.votacoes) {
		d.votacoes[votacao].ID_VOTACAO = votacao;
	}

}

$("#choices").hide()
$("#navegacao_topo a.drop").click(function(){
	if ($("#choices").is(":visible")) {
		$("#choices").hide()
	}else{
		var choices = $(this).attr("title").split(",")
		choices_parsed = ""
		for (var i = 0; i < choices.length; i++) {
			choices_parsed += "<div id='choice_"+choices[i]+"' class='"+((choices[i].indexOf("#") == -1)?"choices":"submenu")+"'>"+choices[i].replace(/_/g," ").replace(/#/g,"")+"</div>"
		}
		$("#choices").html(choices_parsed).css("left",$(this).position().left + "px").width($(this).outerWidth()).show().css("cursor", "pointer")
	}
})

function navegacao(){

	$(".choices").die("click")
	$(".choices").live("click",function(){
		$("#choices").hide()
		escolha = $(this).attr("id")
		if (/(Biomas2012)/.test(escolha)) {
	    window.location.href = "../../html/biomas2012"
		} else if (/(Coligações)/.test(escolha)) {
			window.location.href="../../html/coligacoes"
		} else if (/(Cotas)/.test(escolha)) {
			window.location.href="../../html/cotas"
		} else if (/(Eleições_2012)/.test(escolha)) {
			window.location.href="../../html/eleicoes2012"
		} else if (/(Fuvest_2013)/.test(escolha)) {
			window.location.href="../../html/fuvest2013"
		} else if (/(IDEB)/.test(escolha)) {
			window.location.href="../../html/ideb"
		} else if (/(Intenção_de_Voto)/.test(escolha)) {
			window.location.href="../../html/intencaodevoto"
		} else if (/(Lista_ENEM_2011)/.test(escolha)) {
			window.location.href="../../html/listaenem2011"
		} else if (/(Que_SP_vc_quer?)/.test(escolha)) {
			window.location.href="../../html/quespvcquer"
		} else if (/(Religiões)/.test(escolha)) {
			window.location.href="../../html/religiao"
		} else if (/(São_Paulo_que_balança)/.test(escolha)) {
			window.location.href="../../html/saopauloquebalanca"

		} else if (/(Câmara|Senado)/.test(escolha)) {
			nova_casa = /Câmara/.test(escolha)?"câmara":"senado"
			if (nova_casa != casa) {
                $("#loading").show()
                casa = nova_casa
				rebuild();
				$("#listar_casa").text(escolha.substr(7).replace(/_/g," "))
				escolha = escolha.replace("â","a")
				$(".click").toggleClass("click")
				main(governo, legislatura, escolha.substr(10))
                $("#loading").hide()
			}
		} else if (/(Lula_1|Lula_2|Dilma)/.test(escolha)) {
			novo_governo = /Dilma/.test(escolha)?"dilma":"lula"
			if (novo_governo == "dilma") {
				nova_legislatura = 1
			} else {
				nova_legislatura = /Lula_1/.test(escolha)?"1":"2"
			}
			if (novo_governo != governo || nova_legislatura != legislatura) {
                $("#loading").show()
				governo = novo_governo
				legislatura = nova_legislatura
				rebuild()
				$("#listar_governo").text(escolha.substr(7).replace(/_/g," "))
				$(".click").toggleClass("click")
				main(governo, legislatura, casa.replace("â","a"))
                $("#loading").hide()
			}
		} else {
            $("#loading").show()
			visualizacao = escolha.substr(7)
			$("#listar_tipos").text(visualizacao.replace(/_/g," "))
			mudar_visualizacao();
            $("#loading").hide()
		};
	}).css("cursor", "pointer")

	$(".partido, .estado, .bancada").unbind("click").click(function(){
		$(this).toggleClass("click");
		muda();
	})

	$(".filtro_votacao").unbind("click").click(function(){
		$(this).toggleClass("click").siblings().removeClass("click")
		muda(true);
	})

	$("#todos").unbind("click").click(function(){
		$(".click").toggleClass("click");
		muda();
	})

	$("#filtro_ativo").unbind("click").click(function(){
		$(".click").toggleClass("click");
		muda();
	})

	
	//Desenha as escalas do gráfico
	$('.linha_apoio').each(function (i) {
		$(this).css("top",(i * (altura/4) )+5);
	});
	
	$("#search").autocomplete({
		source:[],
		select: function(event, ui) {
			if (visualizacao == "por_bancadas_partidárias") {
				selecionar_politico(ui.item.value)
			}else{
				mover_alca("fim",$(".evento[title='"+ui.item.value+"']").attr("id"))
			};
		}
	})
	
	function update_pos(el){
		var pos = el.position().top;
		$('.marcador_h').css('top',(pos+29)+'px');
		el.html(parseInt(100-((pos/altura)*100))+'%');
		linha_y = Math.round((pos/altura)*100)/100;
	}

	$('.seletor').unbind("draggable").draggable({
		containment:"parent",
		scroll: false,
		drag: function(event, ui) {
			update_pos($(this));
		},
		stop: function(event, ui) {
			update_pos($(this));
			totalizacao();
		}
	});
	
	$('.alca').unbind("draggable").draggable({
		containment:"parent",
		scroll: false,
		drag: function(event,ui){
			is_fim = $(this).attr('id') == "alca_fim";
			if (is_fim){
				if ($(this).position().left <= $("#alca_inicio").position().left) {
					$(this).css("left", ($("#alca_inicio").position().left + 1) + "px");
					return false;
				}
			}else{
				inicio_left = $(this).position().left;
				if (inicio_left >= $("#alca_fim").position().left) {
					$(this).css("left",($("#alca_fim").position().left - 1) + "px");
					return false;
				}
			}
	    $("#slider_tip").text(update_pos_alca($(this),is_fim).attr("title"))
    },
		stop: function(event, ui) {
			var next = update_pos_alca($(this))
	    $("#slider_tip").text(next.attr("title"))

	    if (is_fim){
	    	fim = (next.length == 0)?datas_sorted[datas_sorted.length-1][1]:d.votacoes[next.attr("id")];
	    } else {
				inicio_left = $(this).position().left;
	    	inicio = (next.length == 0)?datas_sorted[0][1]:d.votacoes[next.attr("id")];
	    }
			muda();
		}
	});

	desenha_eventos(); //Cria eventos na timeline
}

function update_pos_alca(el) {
	slider_finishing(el)
	return find_next(el);
}

function find_next(el){
	var pos = el.position().left;
	return ( $('.evento').filter(function() {return ($(this).position().left < pos) }).last() )
}

function slider_finishing(el) {
	if (is_fim) {
		$('.intervalo').css('width',($('#fim').position().left + el.position().left - (inicio_left+40))+'px');
		$("#liga_caixa").css('left',($("#alca_fim").position().left + $("#fim").position().left - 9));
	}else{
		$('.intervalo').css('left',(inicio_left + 50)+'px')
		.css('width',(($("#alca_fim").position().left + $("#fim").position().left -30) - (inicio_left))+'px')
		$("#liga_caixa").css('left',el.position().left + 50);
	}
}

function mudar_visualizacao() {
	$(".abas").hide();
	$("#"+visualizacao).show();

	if (visualizacao == "por_bancadas_partidárias") { //TODO: usar test de regex aqui!
		$("#search").autocomplete("option", { source: politicos_hints });
		$(".intervalo").fadeIn();
		$("#alca_inicio").fadeIn(function(){
			var alca = $("#alca_fim").text("Fim").removeClass("alca_votacao");
			if (alca.position().left < inicio_left) {
				is_fim = true;
				var next = update_pos_alca($(this));
				fim = d.votacoes[next.attr("id")];
				alca.css("left",(inicio_left + 1)+ "px")
				slider_finishing(alca)
				$("#slider_tip").text(next.attr("title"))
			};
			$("#search").attr("placeholder","buscar politico")
			muda();
		});
	} else if (visualizacao == "por_votações") {
		$("#search").autocomplete("option", { source: votacoes_hints });
    $("#slider_tip").text(update_pos_alca($("#alca_fim").text("Votação").addClass("alca_votacao"),true).attr("title"))
		$(".intervalo").fadeOut();
		$("#alca_inicio").fadeOut();
		$("#search").attr("placeholder","buscar votacao")
		// filtrar_bancada = false;
	  muda();
	};
    $("#loading").hide()
}

function mover_alca(alca,votacao_num) {
	is_fim = (alca == "fim");
	var j_alca = $("#alca_" + alca);
	var votacao = $("#"+votacao_num)
	j_alca.css("left",votacao.position().left+ "px")
	if ( alca == "fim" ) {
		fim = d.votacoes[votacao_num];
	} else {
		inicio = d.votacoes[votacao_num];
	};
	slider_finishing(j_alca)
	$("#slider_tip").text(votacao.attr("title"))
	muda();
}

$("#somar_votacao").click(function(){
	var proximo = $("#"+fim.ID_VOTACAO).next();
	if (proximo.length > 0) mover_alca("fim",proximo.attr("id"));
})

$("#subtrair_votacao").click(function(){
	var anterior = $("#"+fim.ID_VOTACAO).prev();
	if (anterior.length > 0) mover_alca("fim",anterior.attr("id"));
})

$("#tocar_votacao").click(function(){
	if (tocando) {
		$(this).children().removeClass("parar").addClass("tocar")
		tocando = false;
		window.clearInterval(play_interval);
	}else{
		$(this).children().removeClass("tocar").addClass("parar")
		tocando = true;
		if (primeiro_toque) mover_alca("fim",inicio.ID_VOTACAO)
		primeiro_toque = false;
		play_interval = window.setInterval(function(){
			var proximo = $("#"+fim.ID_VOTACAO).next();
			if (proximo.length > 0) mover_alca("fim",proximo.attr("id"));
		},1000);
	};
})

function selecionar_politico(nome) {
	for (var i = 0; i < g.children.length; i++) {
		g.children[i].strokeColor = null
		if(g.children[i].politico == nome) {
			if (g.children[i].visible) {
				//TODO: DRY aqui
				item_selected = g.children[i];
				$("#ficha").show();
				preenche_ficha(item_selected);
				draw_tip_arc(item_selected)
			}else {
				alert("Parlamentar não selecionado.")
				esconder_ficha();
			};
		}
	};
}

function desenha_eventos(callback){
	datas_sorted = [],data_anterior = new Date(0),votacoes_hints = [], votacoes_totais = 0;
	for (votacao in d.votacoes) {
		votacoes_totais ++;
		if (!filtrar_votacoes || (filtrar_votacoes && (filtros_votacoes.indexOf(d.votacoes[votacao].ID_VOTACAO) != -1))) {
			var dt = String(d.votacoes[votacao].DATA).replace(/(\d+)(\d\d)(\d\d)/g,"$1-$2-$3").split("-")
			if (!d.votacoes[votacao].HORA) console.log(d.votacoes[votacao],votacao);
      dt = dt.concat(d.votacoes[votacao].HORA.split(":"))
			if (dt[0] >= 10)
					d.votacoes[votacao].data_parsed = new Date("20"+dt[0],(dt[1]-1),dt[2],dt[3],dt[4])
			else
					d.votacoes[votacao].data_parsed = new Date("200"+dt[0],(dt[1]-1),dt[2],dt[3],dt[4])
			datas_sorted.push([d.votacoes[votacao].data_parsed,d.votacoes[votacao],votacao])
		}
	}
	datas_sorted.sort(function(a,b){return b[0]-a[0]}).reverse()
	var intervalo = ((largura - 130)/datas_sorted.length)
	$('#eventos_tag').html("")
	$('#eventos').html("")
	function posicao(i){return Math.round((i*intervalo)+intervalo)+"px"}//TODO: pixels dont allow floats, so we have a problem on positioning scale
	//DESENHA A BARRA DE TEMPO.....
    if (governo=="dilma") {
		for (var i = 0; i < datas_sorted.length; i++) {
			if(data_anterior.getFullYear() != datas_sorted[i][0].getFullYear()){
				$('#eventos_tag').append('<div class="evento_tag" style="left:'+posicao(i)+'">'+datas_sorted[i][0].getFullYear()+'</div>')
			} else if(data_anterior.getMonth() != datas_sorted[i][0].getMonth() && meses[datas_sorted[i][0].getMonth()]){
				$('#eventos_tag').append('<div class="evento_tag" style="left:'+posicao(i)+'">'+meses[datas_sorted[i][0].getMonth()]+'</div>')
			}
			var dt = datas_sorted[i][1].data_parsed
			var titulo = (i+1) + " - " + dt.getDate() +"/"+ (dt.getMonth()+1) +"/"+ dt.getFullYear() + ((casa == "câmara")?(" "+ dt.getHours() + "h" + (dt.getMinutes()<10?"0":"")+ dt.getMinutes()):"" ) + " - " +datas_sorted[i][1].LINGUAGEM_COMUM + " ("+datas_sorted[i][1].ID_VOTACAO + ")";
			votacoes_hints.push(titulo)
			$('#eventos').append('<div id="'+datas_sorted[i][2]+'" class="evento" data="'+datas_sorted[i][0].getTime()+'" title="'+titulo+'" style="left:'+posicao(i)+'"></div>');
			data_anterior = datas_sorted[i][0]
		}
	} else {
		for (var i = 0; i < datas_sorted.length; i++) {
			if(data_anterior.getFullYear() != datas_sorted[i][0].getFullYear()){
				$('#eventos_tag').append('<div class="evento_tag" style="left:'+posicao(i)+'">'+datas_sorted[i][0].getFullYear()+'</div>')
			//} else if(data_anterior.getMonth() != datas_sorted[i][0].getMonth() && meses[datas_sorted[i][0].getMonth()] && datas_sorted[i][0].getMonth() == 6){
			} else if(data_anterior.getMonth() != datas_sorted[i][0].getMonth() && datas_sorted[i][0].getMonth() == 6){
				$('#eventos_tag').append('<div class="evento_tag" style="left:'+posicao(i)+'">Junho</div>')
			}
			var dt = datas_sorted[i][1].data_parsed;
			var titulo = (i+1) + " - " + dt.getDate() +"/"+ (dt.getMonth()+1) +"/"+ dt.getFullYear() + ((casa == "câmara")?(" "+ dt.getHours() + "h" + (dt.getMinutes()<10?"0":"")+ dt.getMinutes()):"" ) + " - " +datas_sorted[i][1].LINGUAGEM_COMUM + " ("+datas_sorted[i][1].ID_VOTACAO + ")";
			votacoes_hints.push(titulo)
			$('#eventos').append('<div id="'+datas_sorted[i][2]+'" class="evento" data="'+datas_sorted[i][0].getTime()+'" title="'+titulo+'" style="left:'+posicao(i)+'"></div>');
			data_anterior = datas_sorted[i][0];
		}
	}
	inicio = datas_sorted[0][1];
	fim = datas_sorted[datas_sorted.length-1][1];
	if(callback != undefined) {
		callback();
	}else{
		mover_alca("inicio",inicio.ID_VOTACAO)
		mover_alca("fim",fim.ID_VOTACAO)
	}
}


function muda(desenhar){
	estabelece_filtros();
	if ( desenhar ) {
		desenha_eventos(processar_mudanca);
	} else {
		processar_mudanca();
	}
}

function processar_mudanca(){
	enter_frame = 0, politicos_hints = [], votacoes_ids = [], participantes = {}, votantes = {}, partidos = [], votos = [], votantes_sorted = [], media_por_votacao = {},  media_da_votacao = {};

	if (inicio.data_parsed > fim.data_parsed) inicio = fim;
	for (var i = 0; i < datas_sorted.length; i++) {
		if(datas_sorted[i][1].data_parsed >= inicio.data_parsed && datas_sorted[i][1].data_parsed <= fim.data_parsed) {
			votacoes_ids.push(datas_sorted[i][2]);
			media_por_votacao[datas_sorted[i][2]] = {}//[PARTIDO][VOTOS_GOVERNO,VOTOS_TOTAIS]
			media_da_votacao[datas_sorted[i][2]] = [0,0]; //[VOTOS_GOVERNO,VOTOS_TOTAIS]
		}
	};
	$("#vota_count").text(votacoes_ids.length)

	var incluidos = []
	for (var i = 0; i < g.children.length; i++) {
		g.children[i].visible = false
		g.children[i]._index = 0
		if (esta_presente(g.children[i])) incluidos.push(g.children[i]._name)
	}//reset visibility

	for (var i = 0; i < d.votos.length; i++) {//votos = [POLITICO,ID_VOTACAO,PARTIDO,VOTO]
		if(votacoes_ids.indexOf(String(d.votos[i][1])) != -1){ //todos os votos aqui já estão subselecteds
			votos.push(d.votos[i])

			if (incluidos.indexOf("id" + d.votos[i][0]) != -1) {
				if (media_por_votacao[d.votos[i][1]][d.votos[i][2]]) {
					if(d.votos[i][3]>=0 && d.votos[i][3] < 4) media_por_votacao[d.votos[i][1]][d.votos[i][2]][1] ++
				} else {
					media_por_votacao[d.votos[i][1]][d.votos[i][2]] = [0,((d.votos[i][3]>=0 && d.votos[i][3] < 4)?1:0)]
				}
				if(d.votos[i][3]>=0 && d.votos[i][3] < 4) media_da_votacao[d.votos[i][1]][1] ++

				if(d.votacoes[d.votos[i][1]].ORIENTACAO_GOVERNO == "Sim" && d.votos[i][3] == 1) {
					media_por_votacao[d.votos[i][1]][d.votos[i][2]][0] ++
					media_da_votacao[d.votos[i][1]][0] ++
				} else if (d.votacoes[d.votos[i][1]].ORIENTACAO_GOVERNO == "Não" && d.votos[i][3] == 0) {
					media_por_votacao[d.votos[i][1]][d.votos[i][2]][0] ++
					media_da_votacao[d.votos[i][1]][0] ++
				} else if (d.votacoes[d.votos[i][1]].ORIENTACAO_GOVERNO == "Obstrução" && d.votos[i][3] == 3) { //TODO :OBSTRUÇÃO - Não sei direito o que faz
					media_por_votacao[d.votos[i][1]][d.votos[i][2]][0] ++
					media_da_votacao[d.votos[i][1]][0] ++
				}

			}

			participantes["id"+d.votos[i][0]] = [d.votos[i][2],d.votos[i][3]] //ultimo partido e ultimo voto
			if (fim.ID_VOTACAO == d.votos[i][1]) votantes["id"+d.votos[i][0]] = [d.votos[i][2],d.votos[i][3]] //só os votantes da última sessão
			if (partidos.indexOf(d.votos[i][2]) == -1 /* && (filtrar_partido?(filtros_partido[d.votos[i][2]]):true) */) partidos.push(d.votos[i][2])
		}
	}

	for (var i = 0; i < partidos.length; i++) {
    if (!cores[partidos[i]]) console.log(partidos[i])
		if ( !votantes_sorted[cores[partidos[i]][1]]) {
				votantes_sorted[cores[partidos[i]][1]] = []
			}
	} //initiate array of partidos

	for(votante in votantes){
		if (esta_presente(g.children[votante])) {
			politicos_hints.push(g.children[votante].politico)
			g.children[votante].visible = true
			g.children[votante].partido = votantes[votante][0]
			g.children[votante].fillColor = cores[votantes[votante][0]][0]
			g.children[votante].fillColor.alpha = 0.7
			g.children[votante].aceleracao = 0
			g.children[votante].destino_y = 0 //eixo vertical
			g.children[votante].destino_x = 0 //eixo horizontal
			g.children[votante].votos = [0,0,0,0,0,0,0] //o ultimo são os votos com o governo
			votantes[votante].push(votante,g.children[votante].politico); //[PARTIDO,ULTIMO_VOTO,ID_POLITICO,NOME_CASA]
		} else {
			delete votantes[votante]
		}
	}

	politicos_hints.sort();
	if (first_time) {
		$("#search").autocomplete("option", { source: politicos_hints });
		first_time = false;
	}

	for (var i = 0; i < votos.length; i++) {
		//TODO: dupla iteração de votos???
		g.children["id"+votos[i][0]].votos[votos[i][3]] ++;
		if(d.votacoes[votos[i][1]].ORIENTACAO_GOVERNO == "Sim" && votos[i][3] == 1) g.children["id"+votos[i][0]].votos[6] ++;
		if(d.votacoes[votos[i][1]].ORIENTACAO_GOVERNO == "Não" && votos[i][3] == 0) g.children["id"+votos[i][0]].votos[6] ++;
		if(d.votacoes[votos[i][1]].ORIENTACAO_GOVERNO == "Obstrução" && votos[i][3] == 3) g.children["id"+votos[i][0]].votos[6] ++;
	}

	for(politico in votantes) {
		votantes_sorted[cores[g.children[politico].partido][1]].push(votantes[politico])
	}

	for (var i = 0; i < votantes_sorted.length; i++) {
		if (votantes_sorted[i]) {
			votantes_sorted[i].sort(function(a,b){
				if (a[3] < b[3]) return -1;
				if (a[3] > b[3]) return 1;
				return 0;
			});
		}
	};

	var x_pos = 10, distancia = ((largura-30)/politicos_hints.length);

	for (var i = 0; i < votantes_sorted.length; i++) {
		if (votantes_sorted[i]) {
			for (var j = 0; j < votantes_sorted[i].length; j++) {//[PARTIDO,ULTIMO_VOTO,ID_POLITICO,NOME_CASA]
				if (votantes_sorted[i][j]) {
					var politico = votantes_sorted[i][j][2];
					votos_ = g.children[politico].votos;
					g.children[politico].destino_x = x_pos;
					g.children[politico].aceleracao_x = (g.children[politico].destino_x - g.children[politico].position.x)/passos;
					x_pos += distancia;

					//votos_ = [NAO,SIM,ABSTENCAO,OBSTRUCAO,NAO VOTOU,PRESIDENTE,COM_GOVERNO]
					var participacao = votos_[0] + votos_[1] + votos_[2] + votos_[3];
					if (participacao == 0) g.children[politico].visible = false ;
					if (participacao == 0) participacao = 1;
					g.children[politico].governismo = votos_[6]/participacao; //em porcentagem
					g.children[politico].destino_y = (altura - (g.children[politico].governismo * altura)) + 5;

					g.children[politico].aceleracao_y = (g.children[politico].destino_y - g.children[politico].position.y)/passos;
				};
			};
		};
	};

	muda_votacao();
}

function onFrame(event){
	if (enter_frame < passos){
		enter_frame++;

		for (var i = 0; i < votantes_sorted.length; i++) {
			if(votantes_sorted[i]){
				for (var j = 0; j < votantes_sorted[i].length; j++) {//[PARTIDO,ULTIMO_VOTO,ID_POLITICO,NOME_CASA]
					if (votantes_sorted[i][j]) {
						g.children[votantes_sorted[i][j][2]].position.y += g.children[votantes_sorted[i][j][2]].aceleracao_y;
						g.children[votantes_sorted[i][j][2]].position.x += g.children[votantes_sorted[i][j][2]].aceleracao_x;
						if(g.children[votantes_sorted[i][j][2]].strokeColor) {
							item_selected = g.children[votantes_sorted[i][j][2]];
							draw_tip_arc(item_selected);
						}
					};
				};
			}
		};
	} else if (enter_frame == passos){
		enter_frame++;//faz falhar
		totalizacao();
	}
}

function estabelece_filtros() {
	filtros_partido = {}, filtros_uf = {}, filtros_bancada = {}, filtros_votacoes = [], filtrar_partido = false, filtrar_estado = false, filtrar_bancada = false, filtrar_votacoes = false;
	$(".partido.click,.estado.click,.bancada.click,.filtro_votacao.click").each(function(){
		if($(this).is(".partido")){
			filtros_partido[$(this).find("abbr").text()] = true;
			filtrar_partido = true;
		} else if($(this).is(".estado")) {
			filtros_uf[$(this).find("abbr").text()] = true;
			filtrar_estado = true;
		} else if($(this).is(".bancada")) {
			filtros_bancada[$(this).find("abbr").text()] = true;
			filtrar_bancada = true;
			$("#votacoes_de_interesse").show();
		} else if($(this).is(".filtro_votacao")) {
			filtros_votacoes = filtros_votacoes.concat(votacoes_bancadas[casa][$(this).attr("id")]);
			filtrar_votacoes = true;
		}
	});
}


function esta_presente(politico){
	if (filtrar_partido || filtrar_estado || filtrar_bancada) {
		if ( !( 
					(filtrar_partido?filtros_partido[politico.partido]:true) &&
					(filtrar_estado?filtros_uf[politico.uf]:true) &&
					(filtrar_bancada?(filtros_bancada[politico.b_rur] || filtros_bancada[politico.b_ev] || filtros_bancada[politico.b_amb]):true)
					)
				) {
				return false;
		} else {
			return true;
		};
	} else {
		return true;
	};

}

function totalizacao(){
	if (item_selected) {
		if (item_selected.visible) {
			preenche_ficha(item_selected)
		} else {
			esconder_ficha();
		};
	}

	politicos_votantes = 0, governismo_geral = 0, governistas = 0, porcentagem = parseInt($("#seletor_v").text()) ;
	for (var i = 0; i < g.children.length; i++) {
		if(g.children[i].visible){
			politicos_votantes ++;
			governismo_geral += g.children[i].governismo;
			if ((g.children[i].governismo*100) >= porcentagem && g.children[i].governismo != 0) {
				governistas ++;
			}
		}
	};
	$('#titulo').html("Em <b>"+ votacoes_ids.length +"</b> votações, <b>"+ governistas + "</b> "+(casa=="câmara"?"deputados":"senadores")+" votaram com o governo em <b>"+ $("#seletor_v").text() +"</b> das vezes ou mais; e <b>"+ (politicos_votantes-governistas) +"</b> votaram com o governo em "+(($("#seletor_v").text() == "0%")?"":"menos de")+" <b>"+ $("#seletor_v").text() +"</b> das vezes")
	.effect( "highlight", {color:tocando?"#111":"#333"}, 500 );

	$("#media_geral").text(Math.round((governismo_geral/politicos_votantes)*100) + "%")

	atualiza_partidos();
}

function atualiza_partidos(){
	var media_partidos = {};
	var total_media_das_votacoes = 0;

	for(votacao_ in media_da_votacao) {
		media_da_votacao[votacao_][2] = media_da_votacao[votacao_][0] / media_da_votacao[votacao_][1]
		total_media_das_votacoes += media_da_votacao[votacao_][2];
	}

	for(votacao_ in media_por_votacao) {
		for(partido_ in media_por_votacao[votacao_]) {
			var porcentagem = media_por_votacao[votacao_][partido_][0]/media_por_votacao[votacao_][partido_][1];
			if (media_partidos[partido_]) {
				if(!isNaN(porcentagem)) {
					media_partidos[partido_][1] ++;
					media_partidos[partido_][0] += porcentagem;
				}
			}else{
				media_partidos[partido_] = [(isNaN(porcentagem)?0:porcentagem),(isNaN(porcentagem)?0:1)]
			};
		}
	}

	for(partido_ in media_partidos) {
		media_partidos[partido_] = Math.round((media_partidos[partido_][0]/media_partidos[partido_][1])*100)
	}

	$(".presenca_partido").each(function(){
		$(this).parent().hide();
	})

	for(partido in media_partidos) {
		var text_soma = (isNaN(media_partidos[partido]))?($(".presenca_partido#"+partido).parent().hide()):media_partidos[partido]+"%";
		$(".presenca_partido#"+partido).text(text_soma).parent().show();
	}

	for (var i = 0; i < partidos.length; i++) {
		partidos[i]
		var text_soma = (isNaN(media_partidos[partidos[i]]))?"---":media_partidos[partidos[i]]+"%";
		$(".presenca_partido#"+partidos[i]).text(text_soma).parent().show();
	};

}

//Função de mouse over nos deputados
function onMouseDown(event){
	for (var i = 0; i < g.children.length; i++) {g.children[i].strokeColor = null}
	var hit = project.hitTest(event.point, {segments: false, stroke: false, fill: true, tolerance: 3 });
	if(hit && hit.item.visible){
		if(hit) {
			$("#ficha").show();
			preenche_ficha(hit.item)
			draw_tip_arc(hit.item)//vai para o lado esquerdo
		}else{
			esconder_ficha();
		}
	}else{
		esconder_ficha();
	}
}

function esconder_ficha(){
	$("#ficha").hide();
	item_selected.strokeColor = null;
	tip_path.visible = false;
	item_selected = false;
}

function preenche_ficha (item) {
	$("#ficha_partido_cor").css("background-color",cores[item.partido][0])
	$("#ficha_nome").text(item.politico)
	$("#ficha_partido").text(item.partido)
	$("#ficha_uf").text(item.uf)
	$("#ficha_taxa").text(Math.round(item.governismo*100) + "%")
	$("#ficha_contra").text((item.votos[0] + item.votos[1] + item.votos[3]) - item.votos[6]) //TODO: OBSTRUÇÃO - CORRIGIR
	$("#ficha_favor").text(item.votos[6]) //TODO: OBSTRUÇÃO - CORRIGIR
	$("#ficha_abst").text(item.votos[2])
	$("#ficha_n_votou").text(item.votos[4])

	//if (item.foto.indexOf(".jpg") != -1) complemento_camara = "http://s3-sa-east-1.amazonaws.com/estadaodados/fotos_deputados/";
	//var _foto = (((casa == "câmara")?complemento_camara:"") + item.foto)
  if (casa == 'senado')
    var _foto = item.foto
  else 
    var _foto = complemento_camara + item.foto
	if ($("#ficha_foto").attr("src") != _foto) {
		$("#lendo_foto").show();
		$("#ficha_foto").hide().attr("src",_foto).load(function(){
			$(this).show();
			$("#lendo_foto").hide();
		})
	};
}

function draw_tip_arc (item) {
	var left = false;
	item.strokeColor = "white";
	if (item.position.x > (largura/2)) {
		left = true;
		$("#ficha").css("left",10)
	}else{
		$("#ficha").css("left",600)
	};
	tip_path.removeSegments();
	tip_path.add(item.position);
	tip_path.add(new Point(item.position.x, (altura -50) ));
	tip_path.add(new Point((left?133:600), (altura -50) ));
	tip_path.visible = true;
}

function muda_votacao(){

	$("#titulo_voto").html("<br>"+fim.LINGUAGEM_COMUM);
	$("#texto_voto").html(fim.O_QUE_FOI_VOTADO);
	$("#subtitulo_voto").html(fim.EMENTA);
	if (fim.data_parsed) {
		$("#texto_data").html(fim.TIPO + " " + fim.NUMERO + " " + fim.ANO + " &rarr; <span id='t_data'>"+fim.data_parsed.getDate()+"/"+(fim.data_parsed.getMonth()+1)+"/"+fim.data_parsed.getFullYear()+"</span> - <span id='t_hora'>"+fim.data_parsed.getHours()+"h"+(fim.data_parsed.getMinutes()<10?"0":"")+fim.data_parsed.getMinutes()+" &rarr; Orientação do governo: <b>"+fim.ORIENTACAO_GOVERNO+"</b></span>");
	};

	$('#partido_voto').html('<div id="governista" ></div><div id="oposicionista" ></div><div id="abstencao" ></div>');

	var govs = 0, opos = 0, abst = 0, nao_votou = 0, partidos_sorted = [];
	$('#governista').html('<div id="gov_counter">Pró-governo</div><br>');
    $('#oposicionista').html('<div id="ops_counter">Contra o governo</div><br>') //TODO: OBSTRUÇÃO
    // $('#oposicionista').html('<div id="ops_counter">Contra o governo + obstruções</div><br>');
	$('#abstencao').html('<div id="abs_counter">Abstenção</div><br>');

	for (var i = 0; i < partidos.length; i++) {
		partidos_sorted[cores[partidos[i]][1]] = partidos[i];
	};
	for (var i=0; i<partidos_sorted.length; i++){
		if (partidos_sorted[i]) {
			$('#governista').append('<div id="v_g_'+partidos_sorted[i]+'" class="partido_row'+(casa=="senado"?" sen_row":"")+'" ><small>'+partidos_sorted[i]+'</small></div>');
			$('#oposicionista').append('<div id="v_o_'+partidos_sorted[i]+'" class="partido_row'+(casa=="senado"?" sen_row":"")+'" ></div>');
			$('#abstencao').append('<div id="v_a_'+partidos_sorted[i]+'" class="partido_row'+(casa=="senado"?" sen_row":"")+'" ></div>');			
		};
	};

    /*
        #################### Cálculo das taxas de governismo / oposicionismo ########################
        Temos 3 variáveis de classificação da posição dos políticos e dos partidos:
            * ABSTENÇOES (abst)
            * OPOSIÇÃO (opos)
            * GOVERNISMO (govs)
        Em Abstenções são consideradas as abstenções (duh!).
        Em Oposição são considerados os "votos" que não são abstenções e também não não são iguais à orientação do governo para aquela determinada votação.
        Em Governismo são considerados os "votos" que são iguais à orientação do governo com relação à referida votação.
        Existem ainda as ocorrências de "não votou" e o voto do presidente, que não é um voto efetivamente falando.
        Na legenda de cada parlamentar o voto "contra" é a variável "OPOSIÇÃO", e o voto "A FAVOR" é a variável "GOVERNISMO".
        
        A Taxa de Governismo do partido é calculada como uma média simples dos parlamentares daquele partido.

        OBS: A OBSTRUÇÃO pode ser considerada como um voto contra ou como um voto a favor, a depender da orientação do governo.
    */
    for (var i = 0; i < votantes_sorted.length; i++) {
		if(votantes_sorted[i]){
			for (var j = 0; j < votantes_sorted[i].length; j++) {//[PARTIDO,ULTIMO_VOTO,ID_POLITICO,NOME_CASA]
				if (votantes_sorted[i][j] && votantes_sorted[i][j][1] != 4) {

					// tipos_de_voto = ["NAO","SIM","ABSTENCAO","OBSTRUCAO","NAO VOTOU","PRESIDENTE"];
					var class_;
					var type;
					if (votantes_sorted[i][j][1] == 2){
						abst++;
						class_ = "abstencao_voto", type = "a";
					} else if (votantes_sorted[i][j][1] == 3 && fim.ORIENTACAO_GOVERNO != "Obstrução"){ //TODO: OBSTRUÇÃO
					//} else if (votantes_sorted[i][j][1] == 3){
						opos++;
						class_ = "oposicionista_voto", type = "o" //TODO: OBSTRUÇÃO
						//class_ = "oposicionista_voto obstrucao", type = "o";
					} else if (votantes_sorted[i][j][1] == 5){
						abst++;
						class_ = "abstencao_voto /cod_17", type = "a";
					} else if ((fim.ORIENTACAO_GOVERNO == "Sim" && votantes_sorted[i][j][1] == 1) || (fim.ORIENTACAO_GOVERNO == "Não" && votantes_sorted[i][j][1] == 0) || (fim.ORIENTACAO_GOVERNO == "Obstrução" && votantes_sorted[i][j][1] == 3)){ //TODO: OBSTRUÇÃO
					//} else if ((fim.ORIENTACAO_GOVERNO == "Sim" && votantes_sorted[i][j][1] == 1) || (fim.ORIENTACAO_GOVERNO == "Não" && votantes_sorted[i][j][1] == 0)){
						govs++;
						class_ = "governista_voto", type = "g";
					}else {
						opos++;
						class_ = "oposicionista_voto", type = "o";
					}
					var parlamentar = $('<div class="'+class_+'" title="'+g.children[votantes_sorted[i][j][2]].politico+', '+votantes_sorted[i][j][0]+'" style="background-color:'+cores[votantes_sorted[i][j][0]][0]+';" ></div>')

					$("#v_"+type+"_"+votantes_sorted[i][j][0]).append(parlamentar);
					tooltip(parlamentar);

				}else{
					nao_votou ++;
				};
			};
		}
	};

	var plus1;
	govs <= 1 ?  plus1 = " voto" : plus1 = " votos";
	$('#gov_counter').append(' <i> • <b>'+govs+"</b>"+plus1+"</i>");
	opos <= 1 ?  plus1 = " voto" : plus1 = " votos";
	$('#ops_counter').append(' <i> • <b>'+opos+"</b>"+plus1+"</i>");
	abst <= 1 ?  plus1 = " voto" : plus1 = " votos";
	$('#abs_counter').append(' <i> • <b>'+abst+"</b>"+plus1+"</i>");

	if (filtrar_bancada) {
		var bancadas = ""
		for(bancada in filtros_bancada){
			bancadas += bancada + " ";
		}
		$("#filtro_ativo").show().find("#filtros_ativos").text(bancadas);
	}else{
		$("#filtro_ativo").hide();
	};
}
