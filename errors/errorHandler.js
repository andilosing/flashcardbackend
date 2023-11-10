const handleErrors = (error, res) => {
        
    if (error.customError) {
        res.status(error.statusCode).json({error: error.message});
    } else {
        res.status(500).json({errror: 'Unknown Server error.'});
    }
};

module.exports = {
    handleErrors
}