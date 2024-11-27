const calculateFine = async (issueTime, returnTime) => {
  issueTime = new Date(issueTime);
  returnTime = new Date(returnTime);

  // Validate Dates
  if (isNaN(issueTime.getTime()) || isNaN(returnTime.getTime())) {
    throw new Error("Invalid issueTime or returnTime");
  }

  if (returnTime < issueTime) {
    throw new Error("Return time cannot be earlier than issue time");
  }

  const timeDifferenceInMinutes = Math.floor(
    (returnTime - issueTime) / 1000 / 60
  );

  console.log("Time difference in minutes:", timeDifferenceInMinutes);

  if (timeDifferenceInMinutes <= 20) {
    return 0; // No fine
  }

  let fine = 0;

  if (timeDifferenceInMinutes <= 25) {
    fine = (timeDifferenceInMinutes - 20) * 5;
  } else if (timeDifferenceInMinutes <= 40) {
    fine = 5 * 5 + (timeDifferenceInMinutes - 25) * 10;
  } else {
    fine = 5 * 5 + 15 * 10 + (timeDifferenceInMinutes - 40) * 100;
  }

  console.log("Calculated fine:", fine);

  return fine;
};

module.exports = { calculateFine };
