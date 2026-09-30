export class OkLocators {
  constructor(private page: { getByRole(role: string, opts: { name: string }): unknown }) {}

  submit = this.page.getByRole('button', { name: 'Submit' });
}
