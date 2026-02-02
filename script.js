const URL_API = "https://script.google.com/macros/s/AKfycbwV7XwE9Xe8I0CZy8X6X_XFhLZXvQX6A7RqXIp38Xhj0OZwugvMMGQ0CeIlq_cImvKO/exec";

const corpoAgenda = document.getElementById('corpo-agenda');
const seletorData = document.getElementById('data');
const seletorMaquina = document.getElementById('maquina');
let reservasGlobais = {};
// Esta "sacola" guarda as chaves selecionadas de vários dias/máquinas
let selecoesTemporarias = new Set();

function formatarInstrucao(texto) {
  return texto.replace(
    "Equipamentos:",
    "<strong>Equipamentos:</strong>"
  ).replace(/\n/g, "<br>");
}

const instrucoesMaquinas = {
    "1": "O(a) solicitante pela coleta deverá enviar e-mail para Jorge Lucas (jorgelucas@det.ufc.br) com cópia para Romulo (romulojacome@yahoo.com.br) e Annie (annie@det.ufc.br). Para acompanhamento do técnico na coleta e procedimentos administrativos junto à ASTEF será necessário que a requisição seja feita com um período mínimo de 10 dias de antecedência. Sugere-se que o(a) interessado(a) se informe se há sacos para a coleta e baldes para o posterior armazenamento com um período mínimo de 30 dias de antecedência."
        + "\n\nEquipamentos: Pá e Sacos.",
    "2": "Seguir as instruções gerais apresentadas."
        + "\n\nEquipamentos: Quarteador.",
    "3": "Manter fechada a porta onde o peneirador está localizado."
        + "\n\nEquipamentos: Balança, Peneirador e Peneiras.",
    "4": "Seguir as instruções gerais apresentadas."
        + "\n\nEquipamentos: Balança e Estufa.",
    "5": "Seguir as instruções gerais apresentadas."
        + "\n\nEquipamentos: Balança, Crivos circulares e Crivos redutores.",
    "6": "Seguir as instruções gerais apresentadas."
        + "\n\nEquipamentos: Estufa, Balança e Peneiras.",
    "7": "Iniciar o ensaio sexta-feira para finalizar na segunda-feira."
        + "\n\nEquipamentos: Bequer, Estufa e Peneira.",
    "8": "Seguir as instruções gerais apresentadas."
        + "\n\nEquipamentos: Agitador, Balança, Bequer, Estufa e Peneira.",
    "9": "Seguir as instruções gerais apresentadas."
        + "\n\nEquipamentos: Balança, Compactador Marshall, Estufa, Misturador e Peneira.",
    "10": "Seguir as instruções gerais apresentadas."
        + "\n\nEquipamentos: Balança, Bomba de vácuo, Compactador Giratório, Estufa, Misturador e Peneira.",
    "11": "Seguir as instruções gerais apresentadas."
        + "\n\nEquipamentos: Cilindro, Compactador e Estufa.",
    "12": "Seguir as instruções gerais apresentadas."
        + "\n\nEquipamentos: Balança, Estufa Peneira e Rotarex.",
    "13": "Preferencialmente, colocar o material na estufa ao final do dia e retirar no começo da minha do dia seguinte."
        + "\n\nEquipamentos: Estufa."
};

function configurarDataAtual() {
    const hoje = new Date();
    const dataFormatada = hoje.toISOString().split('T')[0];
    document.getElementById('data').value = dataFormatada;
}

function mostrarInstrucoes() {
    const maquinaId = document.getElementById('maquina').value;
    const labelInstrucoes = document.getElementById('texto-instrucoes').innerHTML = formatarInstrucao(instrucoesMaquinas[maquinaId]);
    
    // Busca a instrução no objeto, ou usa um texto padrão se não encontrar
    labelInstrucoes.innerText = instrucoesMaquinas[maquinaId] || "Sem instruções específicas.";
}

configurarDataAtual();

async function carregarReservas() {
    corpoAgenda.innerHTML = '<tr><td colspan="3">Carregando horários...</td></tr>';
    try {
        const response = await fetch(URL_API);
        reservasGlobais = await response.json();
        atualizarAgenda();
    } catch (e) {
        corpoAgenda.innerHTML = '<tr><td colspan="3">Erro ao carregar dados.</td></tr>';
    }
}

function atualizarAgenda() {
    corpoAgenda.innerHTML = '';
    const dataSelecionada = seletorData.value;
    const maquinaSelecionada = seletorMaquina.value;

    mostrarInstrucoes();

    for (let hora = 0; hora < 24; hora++) {
        const horarioFormatado = `${hora}:00 - ${hora + 1}:00`;
        const chaveReserva = `${dataSelecionada}-M${maquinaSelecionada}-${hora}`;
        const nomeReserva = reservasGlobais[chaveReserva];

        // Verifica se esta chave já está na nossa "sacola" de seleções
        const estaMarcado = selecoesTemporarias.has(chaveReserva) ? 'checked' : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${horarioFormatado}</td>
            <td class="${nomeReserva ? 'ocupado' : 'disponivel'}">
                ${nomeReserva ? `Reservado por: ${nomeReserva}` : 'Disponível'}
            </td>
            <td>
                ${nomeReserva 
                    ? '---' 
                    : `<input type="checkbox" class="chk-reserva" value="${chaveReserva}" ${estaMarcado} onchange="gerenciarSelecao(this)">`
                }
            </td>
        `;
        corpoAgenda.appendChild(tr);
    }
}

// Função que adiciona ou remove da "sacola" ao clicar no checkbox
function gerenciarSelecao(checkbox) {
    if (checkbox.checked) {
        selecoesTemporarias.add(checkbox.value);
    } else {
        selecoesTemporarias.delete(checkbox.value);
    }
    
    // Opcional: Atualiza o texto do botão com a contagem
    const btn = document.getElementById('btn-confirmar');
    btn.innerText = selecoesTemporarias.size > 0 
        ? `Confirmar ${selecoesTemporarias.size} reserva(s)` 
        : "Confirmar Reservas Selecionadas";
}

async function reservarSelecionados() {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const orientador = document.getElementById('orientador').value;
    const senhaInformada = document.getElementById('senha-lab').value;

    if (!senhaInformada) return alert("Digite a senha do laboratório!");
    if (!nome || !email || !orientador) return alert("Preencha todos os dados!");
    if (selecoesTemporarias.size === 0) return alert("Selecione pelo menos um horário!");

    const btn = document.getElementById('btn-confirmar');
    btn.disabled = true;
    const textoOriginal = btn.innerText;
    btn.innerText = "Processando reservas...";

    // Agora iteramos sobre a nossa "sacola" (Set)
    for (let chave of selecoesTemporarias) {
        // Extraímos a data e máquina da própria chave (Formato: YYYY-MM-DD-M1-H)
        const partes = chave.split('-');
        const dataAgend = `${partes[0]}-${partes[1]}-${partes[2]}`;
        const numMaquina = partes[3].replace('M', '');

        try {
            const response = await fetch(URL_API, {
                method: 'POST',
                body: JSON.stringify({ 
                    action: 'reservar', 
                    senha: senhaInformada,
                    chave: chave, 
                    nome: nome,
                    email: email,
                    orientador: orientador,
                    dataAgendamento: dataAgend,
                    maquina: `Computador 0${numMaquina}` // Ajusta conforme seus nomes no HTML
                })
            });

            const resultado = await response.text();
            
            if (resultado.includes("Erro: Senha Incorreta")) {
                alert("A senha informada está incorreta!");
                btn.disabled = false;
                btn.innerText = textoOriginal;
                return;
            }
        } catch (e) {
            console.error("Erro ao reservar chave: " + chave);
        }
    }

    alert("Todas as reservas foram concluídas com sucesso!");
    selecoesTemporarias.clear(); // Limpa a sacola após o sucesso
    document.getElementById('senha-lab').value = "";
    btn.disabled = false;
    btn.innerText = "Confirmar Reservas Selecionadas";
    carregarReservas();
}

seletorData.addEventListener('change', atualizarAgenda);
seletorMaquina.addEventListener('change', atualizarAgenda);
carregarReservas();