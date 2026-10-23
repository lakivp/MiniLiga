import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  AdminCompetitionService,
  CompetitionPhase,
  CompetitionGroup,
  CreatePhaseRequest,
  CreateGroupRequest
} from '../../services/admin-competition.service';

@Component({
  selector: 'app-admin-competition',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './admin-competition.component.html',
  styleUrl: './admin-competition.component.scss'
})
export class AdminCompetitionComponent
  implements OnInit {

  competitionId = 0;

  competitionName = 'Takmičenje';

  phases: CompetitionPhase[] = [];

  groups: CompetitionGroup[] = [];

  loading = true;

  saving = false;

  error = '';

  success = '';

  showPhaseForm = false;

  showGroupForm = false;

  editingPhaseId: number | null = null;

  editingGroupId: number | null = null;

  phaseToDelete: CompetitionPhase | null = null;

  deletingPhase = false;

  groupToDelete: CompetitionGroup | null = null;

  deletingGroup = false;

  phaseForm = {
    name: '',
    order: 1,
    type: 0
  };

  groupForm = {
    phaseId: null as number | null,
    name: '',
    order: 1
  };

  phaseTypes = [
  {
    value: 0,
    label: 'Ligaški deo'
  },
  {
    value: 2,
    label: 'Playoff'
  },
  {
    value: 3,
    label: 'Knockout'
  }
];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private competitionService: AdminCompetitionService
  ) {}

  ngOnInit(): void {

    this.competitionId =
      Number(
        this.route.snapshot.paramMap.get('id')
      );

    if (!this.competitionId) {

      this.error =
        'Neispravan ID takmičenja.';

      this.loading = false;

      return;
    }

    this.loadData();
  }

  loadData(): void {

    this.loading = true;

    this.error = '';

    this.competitionService
      .getPhases()
      .subscribe({

        next: phases => {

          this.phases = phases.filter(
            phase =>
              phase.competitionId ===
              this.competitionId
          );

          if (this.phases.length > 0) {

            this.competitionName =
              this.phases[0].competitionName;
          }

          this.loadGroups();
        },

        error: error => {

          console.error(error);

          this.error =
            'Greška prilikom učitavanja faza.';

          this.loading = false;
        }
      });
  }

  loadGroups(): void {

    this.competitionService
      .getGroups()
      .subscribe({

        next: groups => {

          const phaseIds =
            new Set(
              this.phases.map(x => x.id)
            );

          this.groups =
            groups.filter(
              group =>
                phaseIds.has(group.phaseId)
            );

          this.loading = false;
        },

        error: error => {

          console.error(error);

          this.error =
            'Faze su učitane, ali grupe nisu.';

          this.loading = false;
        }
      });
  }

  getGroupsForPhase(
    phaseId: number
  ): CompetitionGroup[] {

    return this.groups
      .filter(
        group =>
          group.phaseId === phaseId
      )
      .sort(
        (a, b) =>
          a.order - b.order
      );
  }

  getPhaseTypeName(
    type: number
  ): string {

    const found =
      this.phaseTypes.find(
        item =>
          item.value === type
      );

    return found?.label ?? 'Custom';
  }

  openCreatePhase(): void {

    this.editingPhaseId = null;

    this.phaseForm = {
      name: '',
      order: this.phases.length + 1,
      type: 0
    };

    this.showPhaseForm = true;

    this.error = '';
    this.success = '';
  }

  openEditPhase(
    phase: CompetitionPhase
  ): void {

    this.editingPhaseId = phase.id;

    this.phaseForm = {
      name: phase.name,
      order: phase.order,
      type: phase.type
    };

    this.showPhaseForm = true;

    this.error = '';
    this.success = '';
  }

  cancelPhaseForm(): void {

    this.showPhaseForm = false;

    this.editingPhaseId = null;
  }

  savePhase(): void {

    this.error = '';
    this.success = '';

    if (
      !this.phaseForm.name.trim()
    ) {

      this.error =
        'Naziv faze je obavezan.';

      return;
    }

    if (
      this.phaseForm.order < 1
    ) {

      this.error =
        'Redosled mora biti najmanje 1.';

      return;
    }

    this.saving = true;

    if (this.editingPhaseId) {

      this.competitionService
        .updatePhase(
          this.editingPhaseId,
          {
            name:
              this.phaseForm.name.trim(),
            order:
              this.phaseForm.order,
            type:
              this.phaseForm.type
          }
        )
        .subscribe({

          next: () => {

            this.saving = false;

            this.showPhaseForm = false;

            this.editingPhaseId = null;

            this.success =
              'Faza je uspešno izmenjena.';

            this.loadData();
          },

          error: error => {

            console.error(error);

            this.saving = false;

            this.error =
              error?.error?.message ??
              'Greška prilikom izmene faze.';
          }
        });

      return;
    }

    const request: CreatePhaseRequest = {
      competitionId:
        this.competitionId,

      name:
        this.phaseForm.name.trim(),

      order:
        this.phaseForm.order,

      type:
        this.phaseForm.type
    };

    this.competitionService
      .createPhase(request)
      .subscribe({

        next: () => {

          this.saving = false;

          this.showPhaseForm = false;

          this.success =
            'Faza je uspešno dodata.';

          this.loadData();
        },

        error: error => {

          console.error(error);

          this.saving = false;

          this.error =
            error?.error?.message ??
            'Greška prilikom kreiranja faze.';
        }
      });
  }

  deletePhase(
    phase: CompetitionPhase
  ): void {

    this.phaseToDelete = phase;
  }

  cancelDeletePhase(): void {

    if (this.deletingPhase) {
      return;
    }

    this.phaseToDelete = null;
  }

  confirmDeletePhase(): void {

    if (!this.phaseToDelete || this.deletingPhase) {
      return;
    }

    const phase = this.phaseToDelete;

    this.error = '';
    this.success = '';
    this.deletingPhase = true;

    this.competitionService
      .deletePhase(phase.id)
      .subscribe({

        next: () => {

          this.deletingPhase = false;

          this.phaseToDelete = null;

          this.success =
            'Faza je uspešno obrisana.';

          this.loadData();
        },

        error: error => {

          console.error(error);

          this.deletingPhase = false;

          this.phaseToDelete = null;

          this.error =
            error?.error?.message ??
            'Fazu nije moguće obrisati.';
        }
      });
  }

  openCreateGroup(
    phase: CompetitionPhase
  ): void {

    const existingGroups =
      this.getGroupsForPhase(
        phase.id
      );

    this.editingGroupId = null;

    this.groupForm = {
      phaseId: phase.id,
      name: '',
      order: existingGroups.length + 1
    };

    this.showGroupForm = true;

    this.error = '';
    this.success = '';
  }

  openEditGroup(
    group: CompetitionGroup
  ): void {

    this.editingGroupId = group.id;

    this.groupForm = {
      phaseId: group.phaseId,
      name: group.name,
      order: group.order
    };

    this.showGroupForm = true;

    this.error = '';
    this.success = '';
  }

  cancelGroupForm(): void {

    this.showGroupForm = false;

    this.editingGroupId = null;
  }

  saveGroup(): void {

    this.error = '';
    this.success = '';

    if (!this.groupForm.phaseId) {

      this.error =
        'Faza grupe je obavezna.';

      return;
    }

    if (
      !this.groupForm.name.trim()
    ) {

      this.error =
        'Naziv grupe je obavezan.';

      return;
    }

    if (
      this.groupForm.order < 1
    ) {

      this.error =
        'Redosled mora biti najmanje 1.';

      return;
    }

    this.saving = true;

    if (this.editingGroupId) {

      this.competitionService
        .updateGroup(
          this.editingGroupId,
          {
            name:
              this.groupForm.name.trim(),

            order:
              this.groupForm.order
          }
        )
        .subscribe({

          next: () => {

            this.saving = false;

            this.showGroupForm = false;

            this.editingGroupId = null;

            this.success =
              'Grupa je uspešno izmenjena.';

            this.loadData();
          },

          error: error => {

            console.error(error);

            this.saving = false;

            this.error =
              error?.error?.message ??
              'Greška prilikom izmene grupe.';
          }
        });

      return;
    }

    const request: CreateGroupRequest = {
      phaseId:
        this.groupForm.phaseId,

      name:
        this.groupForm.name.trim(),

      order:
        this.groupForm.order
    };

    this.competitionService
      .createGroup(request)
      .subscribe({

        next: () => {

          this.saving = false;

          this.showGroupForm = false;

          this.success =
            'Grupa je uspešno dodata.';

          this.loadData();
        },

        error: error => {

          console.error(error);

          this.saving = false;

          this.error =
            error?.error?.message ??
            'Greška prilikom kreiranja grupe.';
        }
      });
  }

  deleteGroup(
    group: CompetitionGroup
  ): void {

    this.groupToDelete = group;
  }

  cancelDeleteGroup(): void {

    if (this.deletingGroup) {
      return;
    }
    this.groupToDelete = null;
  }

  confirmDeleteGroup(): void {

    if (!this.groupToDelete || this.deletingGroup) {
      return;
    }

    const group = this.groupToDelete;

    this.error = '';
    this.success = '';
    this.deletingGroup = true;

    this.competitionService
      .deleteGroup(group.id)
      .subscribe({

        next: () => {

          this.deletingGroup = false;

          this.groupToDelete = null;

          this.success =
            'Grupa je uspešno obrisana.';

          this.loadData();
        },

        error: error => {

          console.error(error);

          this.deletingGroup = false;

          this.error =
            error?.error?.message ??
            'Grupu nije moguće obrisati.';
        }
      });
  }

  clearMessages(): void {

    this.error = '';
    this.success = '';
  }

  phaseAllowsGroups(phase: CompetitionPhase): boolean {
    return (
      phase.type === 0 ||
      phase.type === 1 ||
      phase.type === 2
    );
  }

  getPhaseStructureText(
    phase: CompetitionPhase
  ): string {

    if (this.phaseAllowsGroups(phase)) {
      return 'Faza sa grupama';
    }

    if (phase.type === 3) {
      return 'Knockout faza';
    }

    return 'Prilagođena faza';
  }
}