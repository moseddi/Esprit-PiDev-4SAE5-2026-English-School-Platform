import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EventStatsService } from '../../services/event-stats.service';
import { EventStats } from '../../models/event-stats.model';
import { Subscription } from 'rxjs';

declare var Chart: any;
declare var jspdf: any;
declare var html2canvas: any;

@Component({
    selector: 'app-event-stats-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './event-stats-dashboard.component.html',
    styleUrls: ['./event-stats-dashboard.component.css']
})
export class EventStatsDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('participationChart') participationChartRef!: ElementRef;
    @ViewChild('demographicsChart') demographicsChartRef!: ElementRef;
    @ViewChild('sourceChart') sourceChartRef!: ElementRef;
    @ViewChild('specialtyChart') specialtyChartRef!: ElementRef;
    @ViewChild('dashboardContent') dashboardContent!: ElementRef;

    eventId: number | 'global' | null = null;
    stats: EventStats | null = null;
    private statsSubscription: Subscription | null = null;
    charts: any[] = [];
    errorMessage: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private statsService: EventStatsService
    ) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            const idParam = params['id'];
            console.log('Stats Dashboard Init - ID param:', idParam);

            this.eventId = idParam === 'global' ? 'global' : +idParam;

            if (this.eventId !== null) {
                this.loadInitialStats();
                this.statsService.connectToStats(this.eventId);
            }
        });

        this.statsSubscription = this.statsService.stats$.subscribe(newStats => {
            if (newStats) {
                console.log('Received WebSocket stats update:', newStats);
                this.stats = newStats;
                this.updateCharts();
            }
        });
    }

    ngAfterViewInit() {
        // Initial chart creation will happen after data arrives
    }

    ngOnDestroy() {
        this.statsService.disconnect();
        this.statsSubscription?.unsubscribe();
        this.destroyCharts();
    }

    private destroyCharts() {
        this.charts.forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = [];
    }

    loadInitialStats() {
        if (!this.eventId) return;
        this.errorMessage = null;

        const statsObservable = this.eventId === 'global'
            ? this.statsService.getGlobalStats()
            : this.statsService.getStats(this.eventId as number);

        statsObservable.subscribe({
            next: (data) => {
                console.log('Loaded initial stats:', data);
                this.stats = data;
                // Wait for DOM to be ready
                setTimeout(() => this.initializeCharts(), 200);
            },
            error: (err) => {
                console.error('Error loading stats:', err);
                this.errorMessage = 'Failed to load statistics. Please ensure the backend is running.';
            }
        });
    }

    initializeCharts() {
        if (!this.stats) return;
        this.destroyCharts();

        try {
            // Check if refs are available
            if (!this.participationChartRef || !this.demographicsChartRef ||
                !this.sourceChartRef || !this.specialtyChartRef) {
                console.warn('Chart refs not ready yet');
                return;
            }

            // Participation Pie Chart
            const participationData = [
                this.stats.totalAttended || 0,
                Math.max(0, (this.stats.totalInscribed || 0) - (this.stats.totalAttended || 0))
            ];

            this.charts[0] = new Chart(this.participationChartRef.nativeElement, {
                type: 'doughnut',
                data: {
                    labels: ['Attended', 'Not Attended'],
                    datasets: [{
                        data: participationData,
                        backgroundColor: ['#2D5757', '#F7EDE2'],
                        borderWidth: 0
                    }]
                },
                options: { cutout: '70%', plugins: { legend: { display: false } } }
            });

            // Distributions
            const genderLabels = Object.keys(this.stats.genderDistribution || {});
            const genderValues = Object.values(this.stats.genderDistribution || {});

            this.charts[1] = new Chart(this.demographicsChartRef.nativeElement, {
                type: 'bar',
                data: {
                    labels: genderLabels.length ? genderLabels : ['No Data'],
                    datasets: [{
                        label: 'Gender Distribution',
                        data: genderValues.length ? genderValues : [0],
                        backgroundColor: '#D1AC8E',
                        borderRadius: 8
                    }]
                },
                options: { scales: { y: { beginAtZero: true } } }
            });

            const sourceLabels = Object.keys(this.stats.discoverySourceDistribution || {});
            const sourceValues = Object.values(this.stats.discoverySourceDistribution || {});

            this.charts[2] = new Chart(this.sourceChartRef.nativeElement, {
                type: 'polarArea',
                data: {
                    labels: sourceLabels.length ? sourceLabels : ['No Data'],
                    datasets: [{
                        data: sourceValues.length ? sourceValues : [0],
                        backgroundColor: ['#2D5757', '#D1AC8E', '#EAD5C3', '#B8C0C0', '#4A6D6D']
                    }]
                }
            });

            const specLabels = Object.keys(this.stats.specialtyDistribution || {});
            const specValues = Object.values(this.stats.specialtyDistribution || {});

            this.charts[3] = new Chart(this.specialtyChartRef.nativeElement, {
                type: 'bar',
                data: {
                    labels: specLabels.length ? specLabels : ['No Data'],
                    datasets: [{
                        label: 'Specialty Distribution',
                        data: specValues.length ? specValues : [0],
                        backgroundColor: '#4A6D6D',
                        borderRadius: 8
                    }]
                },
                options: { indexAxis: 'y' }
            });
        } catch (e) {
            console.error('Error initializing charts:', e);
        }
    }

    updateCharts() {
        if (!this.stats || this.charts.length === 0) return;

        try {
            // Update Participation
            this.charts[0].data.datasets[0].data = [
                this.stats.totalAttended || 0,
                Math.max(0, (this.stats.totalInscribed || 0) - (this.stats.totalAttended || 0))
            ];

            // Update Distributions
            if (this.stats.genderDistribution) {
                this.charts[1].data.labels = Object.keys(this.stats.genderDistribution);
                this.charts[1].data.datasets[0].data = Object.values(this.stats.genderDistribution);
            }

            if (this.stats.discoverySourceDistribution) {
                this.charts[2].data.labels = Object.keys(this.stats.discoverySourceDistribution);
                this.charts[2].data.datasets[0].data = Object.values(this.stats.discoverySourceDistribution);
            }

            if (this.stats.specialtyDistribution) {
                this.charts[3].data.labels = Object.keys(this.stats.specialtyDistribution);
                this.charts[3].data.datasets[0].data = Object.values(this.stats.specialtyDistribution);
            }

            this.charts.forEach(chart => {
                if (chart) chart.update('none');
            });
        } catch (e) {
            console.error('Error updating charts:', e);
        }
    }

    async exportToPDF() {
        const data = this.dashboardContent.nativeElement;
        try {
            const canvas = await html2canvas(data, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#FDFBF9'
            });

            const imgWidth = 208;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            const contentDataURL = canvas.toDataURL('image/png');
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            let position = 0;

            pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fileName = this.eventId === 'global' ?
                'Global_Platform_Report.pdf' :
                `Event_Report_${this.eventId}.pdf`;

            pdf.save(fileName);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    }
}
