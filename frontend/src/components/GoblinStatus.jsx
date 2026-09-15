import React from 'react';
import { asset, goblinMood } from '../domain/taskRules.js';
export default function GoblinStatus({ summary }) {
  const mood = goblinMood(summary);
  return <section className="hero mascot-hero" aria-label="Goblin workload reaction"><div className="hero-copy"><span className="hero-tag">✦ YOUR TASKS. OUR QUESTIONABLE METHODS.</span><h2>{mood.text}</h2><p>{mood.note}</p><div className="hero-footer"><span className="crew-stack">{['grub','nib','bonk'].map(name=><img src={asset(name)} alt="" key={name}/>)}</span><span><strong>Small crew. Big quest energy.</strong><br/><small>Every little victory deserves a shiny.</small></span></div></div><img className="mood-goblin" src={asset(mood.name)} alt={`${mood.name}, your tiny goblin coworker`}/><span className="hero-doodle" aria-hidden="true">✧</span></section>;
}
