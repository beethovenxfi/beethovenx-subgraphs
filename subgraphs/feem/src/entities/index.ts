import { FeeM, Project } from '../../generated/schema'

export function getOrCreateProject(projectId: i32): Project {
    let project = Project.load(projectId.toString())

    if (project === null) {
        project = new Project(projectId.toString())
        project.enabled = true
        project.metadataUri = ''
        project.activeFromEpoch = 0
        project.activeToEpoch = 0
        project.contracts = []
        project.numberOfContracts = 0
        project.save()
    }
    return project
}

export function getOrCreateFeeM(address: string): FeeM {
    let feem = FeeM.load(address)

    if (feem === null) {
        feem = new FeeM(address)
        feem.totalContracts = 0
    }
    return feem
}
