const QuizzGame = () => {
  const self = this;

  self.infoElt = document.querySelector("#info");
  self.resumeContainerElt = document.querySelector("#resume-container");
  self.resumeElt = document.querySelector("#resume");
  self.btnGoToHomeElt = document.querySelector("#btn-goto-home");
  self.footerElt = document.querySelector("footer");
  self.homeElt = document.querySelector("#home");
  self.btnTerminerElt = document.querySelector("#btn-terminer");
  self.btnNextElt = document.querySelector("#btn-next");
  self.timerElt = document.querySelector("#timer");
  self.questionElt = document.querySelector("#question");
  self.btnStartElt = document.querySelector("#btn-start");
  /**
   * Eléments de configuration de l'application
   */
  self.gameSettings = {
    timePerQuestion: 10,
    questionsCount: 5,
    apiUrl: `https://opentdb.com/api.php?amount=5`,
    msg: {
      END_OF_REMAING_TIME: "Le temps imparti est écoulé !",
      CHOOSE_AN_ANSWER: "Choisissez une réponse",
      LOADING: "<h1>Chargement en cours...</h1>",
    },
  };

  /**
   * Eléments du contexte en cours: les questions, la question en cours, le timer, ...
   */
  self.contextQuizz = {
    remainingTime: gameSettings.timePerQuestion,
    timerInterval: null,
  };

  self.actions = {
    RESET_TIMER: "RESET_TIMER",
    INIT_QUESTIONS: "INIT_QUESTIONS",
    SET_CURRENT_QUESTION: "SET_CURRENT_QUESTION",
    SET_TIMER_INTERVAL: "SET_TIMER_INTERVAL",
    DECREMENT_REMAINING_TIME: "DECREMENT_REMAINING_TIME",
  };

  /**
   * Gère la mise à jour des données du contexte
   * @param {*} action
   * @param {*} payload
   */
  self.setContext = (action, payload = null) => {
    switch (action) {
      case actions.RESET_TIMER:
        contextQuizz.remainingTime = gameSettings.timePerQuestion;
        break;
      case actions.INIT_QUESTIONS:
        contextQuizz.questions = payload.questions.map((question, idx) => ({
          ...question,
          id: idx + 1,
          answers: mergeAllAnwsers(question),
        }));
        break;
      case actions.SET_CURRENT_QUESTION:
        contextQuizz.currentQuestion = {
          ...payload.question,
        };
        break;
      case actions.SET_TIMER_INTERVAL:
        contextQuizz.timerInterval = setInterval(handleTimer, 1000);
        break;
      case actions.DECREMENT_REMAINING_TIME:
        contextQuizz.remainingTime--;
        break;
    }
  };

  /**
   * Initialise le timer
   */
  self.handleTimer = () => {
    // Affiche le temps restant
    timerElt.innerHTML = contextQuizz.remainingTime;

    // Si le temps est terminé on affiche un message et l'on redirige vers la question suivante
    if (contextQuizz.remainingTime == 0) {
      alert(this.gameSettings.msg.END_OF_REMAING_TIME);
      moveToNextQuestion();
    }

    setContext(actions.DECREMENT_REMAINING_TIME);
  };

  /**
   * Récupère les questions depuis l'API
   * @param {*} apiUrl Url de l'API
   * @returns Promise avec les questions
   */
  self.getQuestionsFromAPI = () => {
    return new Promise((resolve, reject) => {
      try {
        const requete = new XMLHttpRequest();
        requete.open("GET", gameSettings.apiUrl);
        requete.send();
        requete.onload = () => {
          const result = JSON.parse(requete.responseText);
          resolve(result.results);
        };
      } catch (error) {
        console.log(
          `Erreur récupération des questions depuis l'API ${gameSettings.apiUrl} - Error:${error}`
        );
        reject(
          `Erreur récupération des questions depuis l'API ${gameSettings.apiUrl}`
        );
      }
    });
  };

  /**
   * Affiche une question
   * @param {*} question La question à afficher
   * @returns
   */
  self.displayQuestion = (question) => {
    questionElt.innerHTML = `<div>
                    <h2>Question n° ${question.id}/${
      gameSettings.questionsCount
    }</h2>
                    <h3>${question.question}</h3>
                    <div>
                        <ul>
                            ${getAnswersForDisplay(question)}
                        </ul>
                    </div>
                <div>
            </div>
        </div>`;
  };

  /**
   * Retourne les réponses pour l'affichage
   * @param {*} question
   * @returns
   */
  self.getAnswersForDisplay = (question) => {
    console.log(">>> question.id");
    console.log(question.id);
    const result = question.answers
      .sort((a, b) => (a.id > b.id ? 1 : -1))
      .map((answer) => {
        const correct = answer.isCorrect == true ? "correct" : "";
        return `<li id="${correct}">
                        <input
                        ${correct}
                            type="radio"
                            id="${answer.id}"
                            name="answer${question.id}"
                            value="${answer.id}"
                            onClick="javascript:handleSelectAnswer(${question.id}, ${answer.id})" />
                            <label for="${answer.id}">${answer.answer}</label>
                        </li>`;
      });
    return result.join("");
  };

  /**
   * Merge les réponses en un seul objet
   * @param {Méthode} question Merge les réponses correctes et incorrectes dans la propriété "answers"
   */
  self.mergeAllAnwsers = (question) => {
    // Ajoute des propriétés:
    //  - "isCorrect": pour indiquer s'il s'agit ou non de la bonne réponse
    //  - "selected": pour indiquer si c'est la sélection (choix) de l'utilisateur

    const answers = question.incorrect_answers.map((answer) => ({
      answer,
      isCorrect: false,
      selected: false,
    }));

    // Génération d'un index aléatoire pour insérer la réponse correcte dans la liste des réponses
    const answerRandomIndex = Math.floor(
      Math.random() * contextQuizz.questions.length - 1
    );

    // Insertion/merge de la réponse correcte avec les réponses incorrectes
    answers.splice(answerRandomIndex, 0, {
      answer: question.correct_answer,
      isCorrect: true,
      selected: false,
    });
    answers.map((a, idx) => (a.id = idx + 1));
    return answers;
  };

  /**
   * Initialise le contexte du quizz
   * @param {*} questions
   */
  self.initializeQuizzContext = (questions) => {
    // Ajoute une propriété "questions" contenant l'ensemble des questions récupérées depuis l'API
    // avec initialisation de "currentQuestionIndex" index de la question courante à 0
    contextQuizz = { questions };

    // Ajoute une propriété id à chaque "question" et ajoute les questions au contexte
    // Ajoute l'ensemble des réponses (correctes/incorrectes) dans une propriété "answers"
    setContext(actions.INIT_QUESTIONS, { questions });

    setContext(actions.SET_CURRENT_QUESTION, {
      question: { ...contextQuizz.questions[0], id: 1 },
    });

    setContext(actions.RESET_TIMER);
    setContext(actions.RESET_TIMER);
    setContext(actions.SET_TIMER_INTERVAL);
  };

  /**
   * Gère la redirection vers la question suivante
   */
  self.moveToNextQuestion = (checkSelected = false) => {
    // Check si un choix a été effectué
    const isChoiceSelected =
      document.querySelector(
        `input[name="answer${contextQuizz.currentQuestion.id}"]:checked`
      ) != null;
    const isLastQuestion =
      contextQuizz.currentQuestion.id == gameSettings.questionsCount;

    // Si aucun choix n'a été fait et que l'on en demande un (cas utilisateur click bouton "Suivant")
    //  lors on demande à l'utilisateur de donner une réponse
    if (!isChoiceSelected && checkSelected) {
      alert(gameSettings.msg.CHOOSE_AN_ANSWER);
      return;
    }

    // Si nous sommes à la dernière question
    if (isLastQuestion) {
      // alert("End of the Quizz !");
      clearInterval(contextQuizz.timerInterval);
      infoElt.style.display = "none";
      footerElt.style.display = "none";
      questionElt.style.display = "none";
      resumeContainerElt.style.display = "flex";
      displayResume();
    }

    setContext(actions.RESET_TIMER);

    // btnNextElt.disabled =
    //   contextQuizz.currentQuestion.id == gameSettings.questionsCount;
    const currentQuestionId =
      contextQuizz.currentQuestion.id < gameSettings.questionsCount
        ? contextQuizz.currentQuestion.id + 1
        : contextQuizz.currentQuestion.id;
    var question = contextQuizz.questions.find(
      (q) => q.id === currentQuestionId
    );

    setContext(actions.SET_CURRENT_QUESTION, {
      //question: { ...question, answers: mergeAllAnwsers(question) },
      question: { ...question },
    });
    displayQuestion(contextQuizz.currentQuestion);
  };

  /**
   * Affiche le résumé du quizz
   */
  self.displayResume = () => {
    console.log(">>> self.displayResume");
    console.log(contextQuizz.questions);

    const result = contextQuizz.questions.map((question) => {
      var selectedAnswer = question.answers.find((a) => a.selected == true);
      var correctAnswer = question.answers.find((a) => a.isCorrect == true);

      return `<div>
            <h3>Question ${question.id}: ${question.question}</h3>
            <span class="${
              selectedAnswer === correctAnswer ? "answer_ok" : "answer_ko"
            }">Votre réponse: ${
        selectedAnswer ? selectedAnswer.answer : "Non répondue"
      }</span><br/>
            <span>Réponse correcte: ${
              correctAnswer ? correctAnswer.answer : "Non renseignée"
            }</span>
          </div>`;
    });

    resumeElt.innerHTML = result.join("");
  };

  /**
   * Charge et affiche les questions depuis l'API question courante
   */
  self.loadQuestions = () => {
    infoElt.style.display = "flex";
    footerElt.style.display = "flex";
    questionElt.style.display = "flex";
    btnNextElt.style.display = "flex";
    homeElt.style.display = "none";

    getQuestionsFromAPI()
      .then((questions) => {
        initializeQuizzContext(questions);
        displayQuestion(contextQuizz.currentQuestion);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  /**
   * Gère la sélection d'une réponse
   * @param {*} questionId
   * @param {*} answerIndex
   */
  self.handleSelectAnswer = (questionId, answerId) => {
    console.log(questionId + " - " + answerId);
    // Récupère la question concernée
    const question = contextQuizz.questions.find((q) => q.id === questionId);

    // Indique que la réponse concernée a été sélectionnée
    question.answers.map(
      (answer) => (answer.selected = answer.id == answerId ? true : false)
    );

    console.log(contextQuizz.questions);
  };

  /**
   * Démarre le Quizz
   */
  self.handleStartQuizzEvent = () => {
    // Démarre le jeu
    loadQuestions();
  };

  /**
   * Gère l'arrêt du jeu
   */
  self.handleFinishQuizzEvent = () => {
    clearInterval(contextQuizz.timerInterval);
    setContext(actions.RESET_TIMER);

    timerElt.innerHTML = gameSettings.timePerQuestion;
    resumeElt.innerHTML = "";
    questionElt.innerHTML = gameSettings.msg.LOADING;

    homeElt.style.display = "flex";
    infoElt.style.display = "none";
    footerElt.style.display = "none";
    questionElt.style.display = "none";
    resumeContainerElt.style.display = "none";
  };

  /**
   * Initialise le jeu
   */
  self.init = () => {
    // Démarrer
    btnStartElt.addEventListener("click", () => {
      handleStartQuizzEvent();
    });

    // // Terminer
    self.btnTerminerElt.addEventListener("click", () => {
      handleFinishQuizzEvent();
    });

    self.btnGoToHomeElt.addEventListener("click", () => {
      handleFinishQuizzEvent();
    });

    // Passer à la question suivante
    self.btnNextElt.addEventListener("click", () => {
      moveToNextQuestion(true);
    });
  };
  return self;
};
