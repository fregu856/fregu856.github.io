'use strict';

MCMC.registerAlgorithm('HamiltonianMC', {

  description: 'Hamiltonian Monte Carlo',

  about: function() {
    window.open('https://en.wikipedia.org/wiki/Hybrid_Monte_Carlo');
  },

  init: function(self) {
    self.leapfrogSteps = 100;
    self.dt = 0.03;
  },

  reset: function(self) {
    self.chain = [ MultivariateNormal.getSample(self.dim) ];
  },

  attachUI: function(self, folder) {
    folder.add(self, 'leapfrogSteps', 5, 100).step(1).name('Leapfrog Steps');
    folder.add(self, 'dt', 0.05, 0.5).step(0.025).name('Leapfrog &Delta;t');
    folder.open();
  },

  step: function(self, visualizer) {

    var q0 = self.chain.last(),
        p0 = MultivariateNormal.getSample(self.dim);

    if(self.chain.length < 2){
      q0[0, 0] = 0.2;
      q0[0, 1] = -0.5;
      p0[0, 0] = 0.5;
      p0[0, 1] = 0.5;
    }

    var q = q0.copy(),
        p = p0.copy();

    var trajectory = [q.copy()];
    for (var i = 0; i < self.leapfrogSteps; ++i) {
      p.increment(self.gradLogDensity(q).scale(self.dt / 2));
      q.increment(p.scale(self.dt));
      p.increment(self.gradLogDensity(q).scale(self.dt / 2));
      trajectory.push(q.copy());
    }
    visualizer.queue.push({type: 'proposal', proposal: q, trajectory: trajectory, initialMomentum: p0});

    var logAcceptRatio = (self.logDensity(q) - p.norm2() / 2) - (self.logDensity(q0) - p0.norm2() / 2);
    if (Math.random() < Math.exp(logAcceptRatio)) {
      self.chain.push(q.copy());
      visualizer.queue.push({type: 'accept', proposal: q});
    } else {
      self.chain.push(q0.copy());
      visualizer.queue.push({type: 'reject', proposal: q});
    }
  }

});