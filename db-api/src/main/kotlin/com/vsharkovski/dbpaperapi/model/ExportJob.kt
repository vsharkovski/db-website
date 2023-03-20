package com.vsharkovski.dbpaperapi.model

import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import java.sql.Timestamp
import javax.persistence.*
import javax.validation.constraints.NotNull

@Entity
@Table(name = "export_jobs")
data class ExportJob(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @CreationTimestamp
    val creationTime: Timestamp = Timestamp(0),

    @UpdateTimestamp
    val updateTime: Timestamp = Timestamp(0),

    @Enumerated(EnumType.STRING)
    @field:NotNull
    val status: EExportJobStatus = EExportJobStatus.UNPROCESSED,

    @field:NotNull
    val searchTerm: String = "",
)
