const Matiere = require('../models/matiere');
const count = (req, res, next) => {
	const MatiereCount =  Matiere.count((count)=>count)
    if (! MatiereCount){
        res.status(500).json({success:false})

    }
    
	MatiereCount.then(function(result) { res.send({
        count:result
    })});
}

const create = (req, res, next) => {
	Matiere.create(req.body)
		.then((response) => res.status(200).send(response))
		.catch((err) => res.status(400).send(err));
};
const aff = (req, res, next) => {
	Matiere.findAll()
		.then((response) => res.status(200).send(response))
		.catch((err) => res.status(400).send(err));
};
const getOne = (req, res, next) => {
	Matiere.findAll({
		where: { id: req.params.id }
	})
		.then((response) => res.status(200).send(response))
		.catch((err) => res.status(400).send(err));
};
const modifier = (req, res, next) => {
	Matiere.update(
		{
			designation: req.body.designation,
			coef: req.body.coef,
			nbr_heure: req.body.nbr_heure,
			niveauId: req.body.niveauId
		},
		{ where: { id: req.params.id } }
	)
		.then((response) => res.status(200).send(response))
		.catch((err) => res.status(400).send(err));
};
const supprimer = (req, res, next) => {
	Matiere.destroy({ where: { id: req.params.id } })
		.then((response) => res.status(200).send(response))
		.catch((err) => res.status(500).send(err));
};
module.exports = {
	create,
	aff,
	modifier,
	supprimer,
	getOne
};
