document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dateRangeInput = document.getElementById('date-range');
    const datepickerElement = document.getElementById('datepicker');
    const currentMonthElement = document.getElementById('current-month');
    const currentYearElement = document.getElementById('current-year');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const calendarDaysElement = document.getElementById('calendar-days');
    const clearButton = document.getElementById('clear-dates');
    const applyButton = document.getElementById('apply-dates');
    
    // Year selector elements
    const yearSelectorPanel = document.getElementById('year-selector-panel');
    const yearsGrid = document.getElementById('years-grid');
    const yearRangeDisplay = document.getElementById('year-range-display');
    const prevYearsButton = document.getElementById('prev-years');
    const nextYearsButton = document.getElementById('next-years');

    // State variables
    let currentDate = new Date();
    let startDate = null;
    let endDate = null;
    let selectionState = 'start'; // can be 'start' or 'end'
    let displayYear = currentDate.getFullYear();
    let displayMonth = currentDate.getMonth();
    let selectionComplete = false;
    let hoverDate = null; // Track the date being hovered over
    let yearViewStartYear = Math.floor(displayYear / 16) * 16; // For year view pagination

    // Format date to string (MM/DD/YYYY)
    function formatDate(date) {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    // Update the date range input value
    function updateDateRangeInput() {
        if (startDate && endDate) {
            dateRangeInput.value = `${formatDate(startDate)} - ${formatDate(endDate)}`;
            selectionComplete = true;
            // Update apply button state
            applyButton.classList.add('active');
        } else if (startDate) {
            dateRangeInput.value = formatDate(startDate);
            selectionComplete = false;
            // Update apply button state
            applyButton.classList.remove('active');
        } else {
            dateRangeInput.value = '';
            selectionComplete = false;
            // Update apply button state
            applyButton.classList.remove('active');
        }
    }

    // Parse string date to Date object
    function parseDate(dateString) {
        if (!dateString) return null;
        const [month, day, year] = dateString.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Check if two dates are the same day
    function isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }

    // Check if a date is between start and end dates (inclusive)
    function isInRange(date, start, end) {
        if (!start || !end || !date) return false;
        
        const normalizedDate = new Date(date).setHours(0, 0, 0, 0);
        const normalizedStart = new Date(start).setHours(0, 0, 0, 0);
        const normalizedEnd = new Date(end).setHours(0, 0, 0, 0);
        
        return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
    }

    // Update hover effect on calendar
    function updateHoverEffect() {
        if (selectionState !== 'end' || !startDate || !hoverDate) return;

        // Clear previous hover effects first
        document.querySelectorAll('.day.hover-in-range').forEach(day => {
            day.classList.remove('hover-in-range');
        });
        document.querySelectorAll('.day.hover-end-date').forEach(day => {
            day.classList.remove('hover-end-date');
        });

        // Don't apply hover effect if hover date is before start date
        if (hoverDate < startDate) return;

        // Apply hover effect to all days in range between start and hover date
        document.querySelectorAll('.day:not(.empty)').forEach(dayElement => {
            const dayNum = parseInt(dayElement.textContent);
            if (!isNaN(dayNum)) {
                const currentDate = new Date(displayYear, displayMonth, dayNum);
                
                // Check if this day is the hovered end date
                if (isSameDay(currentDate, hoverDate)) {
                    dayElement.classList.add('hover-end-date');
                }
                
                // Check if this day is in the hovered range
                if (isInRange(currentDate, startDate, hoverDate) && 
                    !isSameDay(currentDate, startDate) && 
                    !isSameDay(currentDate, hoverDate)) {
                    dayElement.classList.add('hover-in-range');
                }
            }
        });
    }

    // Generate the year selection panel
    function generateYearGrid() {
        yearsGrid.innerHTML = '';
        const currentYear = new Date().getFullYear();
        const yearCount = 16; // Display 16 years (4x4 grid)
        
        // Update the year range display
        yearRangeDisplay.textContent = `${yearViewStartYear} - ${yearViewStartYear + yearCount - 1}`;
        
        // Generate year buttons
        for (let i = 0; i < yearCount; i++) {
            const yearValue = yearViewStartYear + i;
            const yearElement = document.createElement('div');
            yearElement.classList.add('year-item');
            yearElement.textContent = yearValue;
            
            // Highlight current year
            if (yearValue === currentYear) {
                yearElement.classList.add('current-year');
            }
            
            // Highlight selected year
            if (yearValue === displayYear) {
                yearElement.classList.add('selected');
            }
            
            // Add click event to select year
            yearElement.addEventListener('click', function() {
                displayYear = yearValue;
                yearSelectorPanel.classList.remove('show');
                generateCalendar();
            });
            
            yearsGrid.appendChild(yearElement);
        }
    }

    // Toggle the year selector panel
    function toggleYearSelector() {
        if (yearSelectorPanel.classList.contains('show')) {
            yearSelectorPanel.classList.remove('show');
        } else {
            yearSelectorPanel.classList.add('show');
            generateYearGrid();
        }
    }

    // Generate days for the current month view
    function generateCalendar() {
        calendarDaysElement.innerHTML = '';
        
        // Update the calendar container class based on selection state
        datepickerElement.classList.remove('selecting-start', 'selecting-end');
        datepickerElement.classList.add(`selecting-${selectionState}`);
        
        // Set the current month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthElement.textContent = monthNames[displayMonth];
        currentYearElement.textContent = displayYear;
        
        // Get first day of the month
        const firstDayOfMonth = new Date(displayYear, displayMonth, 1);
        const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
        
        // Get day of week for the first day (0 = Sunday, 6 = Saturday)
        const firstDayOfWeek = firstDayOfMonth.getDay();
        
        // Add empty days for previous month
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day', 'empty');
            calendarDaysElement.appendChild(emptyDay);
        }
        
        // Create day elements
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.textContent = i;
            
            const currentDateInLoop = new Date(displayYear, displayMonth, i);
            currentDateInLoop.setHours(0, 0, 0, 0);
            
            // Check if this day is today
            if (
                today.getFullYear() === displayYear &&
                today.getMonth() === displayMonth &&
                today.getDate() === i
            ) {
                dayElement.classList.add('today');
            }
            
            // Check if this day is selected as start date
            if (startDate && isSameDay(currentDateInLoop, startDate)) {
                dayElement.classList.add('selected', 'start-date');
            }
            
            // Check if this day is selected as end date
            if (endDate && isSameDay(currentDateInLoop, endDate)) {
                dayElement.classList.add('selected', 'end-date');
            }
            
            // Check if this day is in the selected range
            if (startDate && endDate && isInRange(currentDateInLoop, startDate, endDate)) {
                dayElement.classList.add('in-range');
            }

            // Disable past dates if selecting start date
            if (selectionState === 'start' && currentDateInLoop < today) {
                dayElement.classList.add('disabled');
            }

            // Disable dates before start date if selecting end date
            if (selectionState === 'end' && startDate && currentDateInLoop < startDate) {
                dayElement.classList.add('disabled');
            }
            
            // Add hover events for previewing date range
            if (selectionState === 'end' && startDate && !dayElement.classList.contains('disabled')) {
                dayElement.addEventListener('mouseenter', function() {
                    hoverDate = new Date(displayYear, displayMonth, i);
                    hoverDate.setHours(0, 0, 0, 0);
                    updateHoverEffect();
                });
                
                dayElement.addEventListener('mouseleave', function() {
                    hoverDate = null;
                    updateHoverEffect();
                });
            }
            
            // Add click event to select date
            dayElement.addEventListener('click', function() {
                if (dayElement.classList.contains('disabled')) {
                    return;
                }

                const selectedDate = new Date(displayYear, displayMonth, i);
                selectedDate.setHours(0, 0, 0, 0);
                
                if (selectionState === 'start') {
                    // Set start date and switch to end date selection
                    startDate = selectedDate;
                    endDate = null;
                    selectionState = 'end';
                    selectionComplete = false;
                    
                    // Highlight the selected start date
                    generateCalendar();
                    
                    // Update input with partial selection
                    updateDateRangeInput();
                } else {
                    // Set end date
                    if (selectedDate >= startDate) {
                        endDate = selectedDate;
                        selectionComplete = true;
                        
                        // Update the input field with the selected range
                        updateDateRangeInput();
                        
                        // After both dates are selected, keep the calendar open
                        // but reset selection state for next time
                        selectionState = 'start';
                        
                        // Regenerate calendar to show the selected range
                        generateCalendar();
                    }
                }
            });
            
            calendarDaysElement.appendChild(dayElement);
        }
    }

    // Initialize datepicker
    function initDatepicker() {
        // Initial state of apply button should be inactive
        applyButton.classList.remove('active');
        
        // Set up event listener for the date input
        dateRangeInput.addEventListener('click', function(e) {
            e.preventDefault();
            
            // If the datepicker is already open and has a complete selection,
            // reset the selection for a new range
            if (datepickerElement.classList.contains('show') && startDate && endDate) {
                startDate = null;
                endDate = null;
                selectionState = 'start';
                selectionComplete = false;
                dateRangeInput.value = '';
                updateDateRangeInput();
                generateCalendar();
            }
            
            // Always show the datepicker when clicking the input
            datepickerElement.classList.add('show');
            
            // Reset selection state to start when opening
            if (!startDate) {
                selectionState = 'start';
            }
        });
        
        // Year selection
        currentYearElement.addEventListener('click', toggleYearSelector);
        
        // Year selector navigation buttons
        prevYearsButton.addEventListener('click', function() {
            yearViewStartYear -= 16;
            generateYearGrid();
        });
        
        nextYearsButton.addEventListener('click', function() {
            yearViewStartYear += 16;
            generateYearGrid();
        });
        
        // Click outside year selector to close it
        document.addEventListener('click', function(e) {
            if (yearSelectorPanel.classList.contains('show') && 
                !yearSelectorPanel.contains(e.target) && 
                e.target !== currentYearElement) {
                yearSelectorPanel.classList.remove('show');
            }
        });
        
        // Previous month button
        prevMonthButton.addEventListener('click', function() {
            displayMonth--;
            if (displayMonth < 0) {
                displayMonth = 11;
                displayYear--;
            }
            generateCalendar();
        });
        
        // Next month button
        nextMonthButton.addEventListener('click', function() {
            displayMonth++;
            if (displayMonth > 11) {
                displayMonth = 0;
                displayYear++;
            }
            generateCalendar();
        });
        
        // Clear button
        clearButton.addEventListener('click', function() {
            startDate = null;
            endDate = null;
            selectionComplete = false;
            selectionState = 'start';
            dateRangeInput.value = '';
            updateDateRangeInput();
            generateCalendar();
        });
        
        // Apply button - only close the datepicker if both dates are selected
        applyButton.addEventListener('click', function() {
            if (selectionComplete) {
                datepickerElement.classList.remove('show');
            } else {
                // If selection is not complete, show visual feedback (optional)
                applyButton.classList.add('shake');
                setTimeout(() => {
                    applyButton.classList.remove('shake');
                }, 500);
            }
        });
        
        // Close datepicker when clicking outside ONLY if both dates are selected
        document.addEventListener('click', function(e) {
            if (!datepickerElement.contains(e.target) && 
                e.target !== dateRangeInput) {
                // Only close if selection is complete or no selection started
                if (selectionComplete || (!startDate && !endDate)) {
                    datepickerElement.classList.remove('show');
                }
            }
        });
        
        // Initial calendar generation
        generateCalendar();
    }
    
    // Initialize the datepicker
    initDatepicker();
});