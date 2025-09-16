import { setOutput, setFailed } from "@actions/core";
import {Octokit} from "@octokit/action";
import { getInputsWithDefaults } from "./getInputsWithDefaults";
import { getReviewers } from "./getReviewers";

async function run(): Promise<void> {
  try {
    const octokit = new Octokit();

    const inputs = getInputsWithDefaults();

    const pullRequest = await octokit.pulls.create({
      ...inputs
    });
    const pullNumber = pullRequest.data.number

    const reviewers = getReviewers();

    if (reviewers.length > 0) {
      await octokit.pulls.createReviewRequest({
        owner: inputs.owner,
        repo: inputs.repo,
        pull_number: pullNumber,
        reviewers
      });
    }

    setOutput("number" ,pullNumber.toString());

    // Intentar mergear automáticamente el PR
    // Primero, obtener el estado mergeable
    const prInfo = await octokit.pulls.get({
      owner: inputs.owner,
      repo: inputs.repo,
      pull_number: pullNumber
    });

    if (prInfo.data.mergeable) {
      await octokit.pulls.merge({
        owner: inputs.owner,
        repo: inputs.repo,
        pull_number: pullNumber,
        merge_method: "merge"
      });
    } else {
      console.log("El PR no es mergeable automáticamente (puede tener conflictos o estar en estado inadecuado).");
    }
  } catch (error) {
    setFailed(error.message);
  }
}

run();
