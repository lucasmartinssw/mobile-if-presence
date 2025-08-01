# Sistema de Presença Mobile (IF Presence)

## Sobre o Projeto

O **IF Presence** é um sistema de controle de presença para estudantes, desenvolvido como um aplicativo mobile híbrido. A aplicação serve como uma "catraca virtual", permitindo que alunos e professores registrem sua presença em sala de aula de forma segura, validando a localização do dispositivo em uma área geográfica pré-definida (**geofence**).

O sistema é integrado a um **backend em PHP** que gerencia a autenticação de usuários, o registro das sessões de chamada e armazena os dados de presença.

---

## Funcionalidades

- **Login de Usuários:** Autenticação de professores e alunos.
- **Geolocalização:** Validação da localização do usuário para confirmar se ele está dentro da área escolar demarcada.
- **Registro de Presença:** Envio de dados de presença (ID do aluno, ID da chamada, localização e timestamp) para o banco de dados.
- **Gerenciamento de Chamadas:** Controle de chamadas agendadas, com horários de início e fim.
- **Notificações (Futuro):** Envio de notificações automáticas para responsáveis por alunos ausentes.

---

## Tecnologias Utilizadas

### Frontend (Aplicativo Mobile):

- **Ionic Framework:** Com Angular para o desenvolvimento da interface.
- **Capacitor:** Para a integração com recursos nativos do Android e iOS.
- **Capacitor Geolocation:** Acesso ao GPS do dispositivo.

### Backend (API & Banco de Dados):

- **PHP:** Linguagem de programação da API.
- **MySQL:** Banco de dados relacional.
- **Apache/XAMPP:** Servidor web para o ambiente de desenvolvimento.
