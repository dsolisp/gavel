class AzureDevOpsClient {
  constructor(options) {
    this.collectionUri = options.collectionUri.replace(/\/$/, '');
    this.project = options.project;
    this.repositoryId = options.repositoryId;
    this.pullRequestId = options.pullRequestId;
    this.token = options.token;
    this.allowWrites = options.allowWrites === true;
    this.fetch = options.fetchImpl || globalThis.fetch;
    this.timeoutMs = options.timeoutMs || 15000;
    this.retries = options.retries || 0;
    if (!this.fetch) throw new Error('Node.js with fetch support is required');
  }

  api(path) {
    return `${this.collectionUri}/${encodeURIComponent(this.project)}/_apis/${path}`;
  }

  async request(path, options = {}) {
    const method = options.method || 'GET';
    if (method !== 'GET' && !this.allowWrites) throw new Error(`Azure DevOps write blocked in shadow mode: ${method}`);
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetch(this.api(path), {
          ...options,
          method,
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${this.token}`,
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers,
          },
        });
        const transient = method === 'GET' && (response.status === 429 || response.status >= 500);
        if (transient && attempt < this.retries) continue;
        if (!response.ok) throw new Error(`Azure DevOps API ${method} failed with HTTP ${response.status}`);
        return response.status === 204 ? null : response.json();
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new Error(`Azure DevOps API ${method} exhausted retries`);
  }

  getPullRequest() {
    return this.request(`git/repositories/${encodeURIComponent(this.repositoryId)}/pullRequests/${this.pullRequestId}?api-version=7.1`);
  }

  getIterations(includeCommits = false) {
    return this.request(`git/repositories/${encodeURIComponent(this.repositoryId)}/pullRequests/${this.pullRequestId}/iterations?includeCommits=${includeCommits === true}&api-version=7.1`);
  }

  async getIterationChanges(iterationId, compareTo = 0) {
    if (!Number.isInteger(iterationId) || iterationId < 1) throw new Error('iterationId must be a positive integer');
    if (!Number.isInteger(compareTo) || compareTo < 0 || compareTo >= iterationId) {
      throw new Error('compareTo must be a non-negative integer lower than iterationId');
    }

    const changeEntries = [];
    let skip = 0;
    let top = 2000;
    do {
      const page = await this.request(`git/repositories/${encodeURIComponent(this.repositoryId)}/pullRequests/${this.pullRequestId}/iterations/${iterationId}/changes?$top=${top}&$skip=${skip}&$compareTo=${compareTo}&api-version=7.1`);
      changeEntries.push(...(page.changeEntries || []));
      if (!page.nextSkip || !page.nextTop) break;
      if (page.nextSkip <= skip) throw new Error('Azure DevOps iteration pagination did not advance');
      skip = page.nextSkip;
      top = page.nextTop;
    } while (true);
    return { changeEntries };
  }

  getThreads() {
    return this.request(`git/repositories/${encodeURIComponent(this.repositoryId)}/pullRequests/${this.pullRequestId}/threads?api-version=7.1`);
  }

  getWorkItems() {
    return this.request(`git/repositories/${encodeURIComponent(this.repositoryId)}/pullRequests/${this.pullRequestId}/workitems?api-version=7.1`);
  }

  getPullRequestStatuses() {
    return this.request(`git/repositories/${encodeURIComponent(this.repositoryId)}/pullRequests/${this.pullRequestId}/statuses?api-version=7.1-preview.1`);
  }

  getPolicyEvaluations(projectId) {
    const artifactId = encodeURIComponent(`vstfs:///CodeReview/CodeReviewId/${projectId}/${this.pullRequestId}`);
    return this.request(`policy/evaluations?artifactId=${artifactId}&api-version=7.1-preview.1`);
  }

  createThread(thread) {
    return this.request(`git/repositories/${encodeURIComponent(this.repositoryId)}/pullRequests/${this.pullRequestId}/threads?api-version=7.1`, {
      method: 'POST', body: JSON.stringify(thread),
    });
  }

  updateThread(threadId, patch) {
    return this.request(`git/repositories/${encodeURIComponent(this.repositoryId)}/pullRequests/${this.pullRequestId}/threads/${threadId}?api-version=7.1`, {
      method: 'PATCH', body: JSON.stringify(patch),
    });
  }

  updateComment(threadId, commentId, content) {
    return this.request(`git/repositories/${encodeURIComponent(this.repositoryId)}/pullRequests/${this.pullRequestId}/threads/${threadId}/comments/${commentId}?api-version=7.1`, {
      method: 'PATCH', body: JSON.stringify({ content }),
    });
  }

  setCommitStatus(commitId, status) {
    return this.request(`git/repositories/${encodeURIComponent(this.repositoryId)}/commits/${commitId}/statuses?api-version=7.1`, {
      method: 'POST', body: JSON.stringify(status),
    });
  }

  setVote(reviewerId, vote) {
    return this.request(`git/repositories/${encodeURIComponent(this.repositoryId)}/pullRequests/${this.pullRequestId}/reviewers/${encodeURIComponent(reviewerId)}?api-version=7.1`, {
      method: 'PUT', body: JSON.stringify({ vote }),
    });
  }
}

module.exports = { AzureDevOpsClient };