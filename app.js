const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;
const count = 100;
const API_URL = 'https://rithm-jeopardy.herokuapp.com/api/';

let categories = [];

/* Get NUM_CATEGORIES random category IDs from API. */
async function getCategoryIds() {
    const response = await axios.get(`${API_URL}categories`, {
        params: { count },
    });
    const randomCategories = _.sampleSize(response.data, NUM_CATEGORIES); // Use Lodash to sample random categories
    return randomCategories.map(cat => cat.id);
}

/* Return object with data about a category. */
async function getCategory(catId) {
    const response = await axios.get(`${API_URL}category`, {
        params: { id: catId },
    });
    const category = response.data;
    const clues = category.clues.slice(0, NUM_QUESTIONS_PER_CAT).map(clue => ({
            question: clue.question,
            answer: clue.answer,
            showing: null,
        }));

    return { title: category.title, clues };
}

/* Fill the HTML table #jeopardy with the categories and question cells. */
async function fillTable() {
    const $thead = $('#jeopardy thead');
    const $tbody = $('#jeopardy tbody');

    // Empyting existing content
    $thead.empty();
    $tbody.empty();

    // Add category headers
    const $tr = $('<tr>');
    for (let category of categories) {
        $tr.append($('<th>').text(category.title.toUpperCase()));
    }
    $thead.append($tr);

    // Add rows for questions
    for (let rowIdx = 0; rowIdx < NUM_QUESTIONS_PER_CAT; rowIdx++) {
        const $tr = $('<tr>');
        for (let colIdx = 0; colIdx < NUM_CATEGORIES; colIdx++) {
            $tr.append(
                $('<td>')
                    .addClass('clue')
                    .attr('data-cat-idx', colIdx)
                    .attr('data-clue-idx', rowIdx)
                    .html('?')
            );
        }
        $tbody.append($tr);
    }
}

/* Handle clicking on a clue. */
function handleClick(evt) {
    const $cell = $(evt.target);
    const catIdx = $cell.data('cat-idx');
    const clueIdx = $cell.data('clue-idx');
    const clue = categories[catIdx].clues[clueIdx];

    if (clue.showing === null) {
        $cell.text(clue.question);
        clue.showing = 'question';
    } else if (clue.showing === 'question') {
        $cell.text(clue.answer).css('background-color', '#7f3896'); //The correct answer background color cyan blue
        clue.showing = 'answer';
        $cell.addClass('not-allowed');
    } else {
        return;
    }
}

/* Show loading spinner and disable the start button and hide board. */
function showLoadingView() {
    $('#restart').text('Loading...').prop('disabled', true);
    $('#spin-container').show();
    $('#jeopardy').hide();
}

/* Hide loading spinner and enable the start button and show board after loading. */
function hideLoadingView() {
    $('#restart').text('Restart').prop('disabled', false);
    $('#spin-container').hide();
    $('#jeopardy').show();
}

/* Start the game: get data and create HTML table. */
async function setupAndStart() {
    showLoadingView();

    const catIds = await getCategoryIds();
    categories = [];
    for (let id of catIds) {
        categories.push(await getCategory(id));
    }

    await fillTable();
    hideLoadingView();
}

/* On click of start/restart button, set up the game. */
$('#restart').on('click', setupAndStart);

/* On page load, add event handler for clicking clues. */
$(document).ready(function () {
    $('#jeopardy').on('click', '.clue', handleClick)
});
