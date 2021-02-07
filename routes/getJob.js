

module.exports = async (ctx, next) => {
	// Allows the client to query the state of a background job
		let id = ctx.query.id
		let job = await workQueue.getJob(id);
	
		if (job === null) {
			res.status(404).end();
		} else {
			let state = await job.getState();
			let progress = job._progress;
			let reason = job.failedReason;
			res.json({ id, state, progress, reason });
		}
}